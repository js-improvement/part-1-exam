'use strict';

var ws = new WebSocket('wss://part-1-task-1.herokuapp.com');
// var ws = new WebSocket('ws://localhost:8080');

var MAX = 10;
var MAX_ERROR = 5;
var index = 0;
var errIndex = 0;
var carrentTask = 2;
var mode = 'complete'; // complete var mode = 'test'
//var mode = 'test';
var newData = [];

// объект с функциями заданий
var operations = {
    echo: echo,
    reverse: reverse,
    sum: sum,
    calc: calc,
    median: median,
    groups: groups,
    recurrence: recurrence,
    validator: validator,
    recurrence2: recurrence2
};

// Объект с функциями проверок
var validation = {
    isNumber: function (message) {


        return typeof(message) === 'number';
    }, // - значение является числом
    isString: function (message) {
        return typeof (message) === 'string';
    }, //  - значение является строкой
    isBoolean: function (message) {
        return typeof (message) === 'boolean';
    }, //  - значение является булевым типом
    isJSON: function (message) {
        try {
            JSON.parse(message);
        } catch (e) {
            return false;
        }

        return true;
    }, //  - значение является валидная json строка
    more: function (message, n) {
        return Number(message) > n;
    }, //  - больше числа N
    less: function (message, n) {
        return Number(message) < n;
    }, //  - меньше числа N
    isPrime: function (message) {
        var n = Number(message);
        for (var i = 2; i < Math.sqrt(n); i++) {
            if (n % i === 0) {
                return false;
            }
        }

        return true;

    }, //  - является простым числом
    longer: function (message, n) {
        return message.length > n;
    }, // - длиннее N символов
    shorter: function (message, n) {
        return message.length < n;
    }, //  - короче N символов
    contain: function (message, n, str) {
        if (typeof (message) !== 'string') {
            return false;
        }

        return message.indexOf(str) !== -1;
    }, //  - содержит подстроку STR
    truly: function (message) {
        return message === true;
    }, //  - буленовское истиное значение (true)
    falsy: function (message) {
        return message === false;
    } //  - буленовское ложное значение (false)
};


ws.onopen = function (e) {
    console.info('open', e);
    ws.send(JSON.stringify({
        type: 'hi',
        mode: mode,
        repo: 'test',
        name: 'avshev'
    }));

    //  console.info();
};

ws.onerror = function (e) {
    console.info('error' + errIndex, e);
    // var message = JSON.parse(e);
    errIndex++;
};

ws.onclose = function (e) {
    console.info('close', e);
    var message = JSON.parse(e.reason);
    if (e.reason.length > 0) {
        newData.push(message);
    }
    printTasks();
    if (message.message === 'Timeout to answer 1000ms') {
        ws = new WebSocket('wss://part-1-task-1.herokuapp.com');
    }

};

ws.onmessage = function (e) {
    var message = JSON.parse(e.data);
    console.info('input message', message);
    if (message.type === 'info' && index === 0) {
        testNxtOperations();

    }
    if (message.type === 'ask') {
        answer(message);
    }
    if (message.type === 'error') {
        errIndex++;
    }
    if (message.type === 'done') {
        done();
        testNxtOperations();
    }
    if (message.type === 'askComplete') {
        askComplete();
    }

};

function askComplete() {
    var i = newData.length - 1;
    if (i < 0) {
        console.info('Чтото не то. ');

        return null;
    }
    var taskName = newData[i].taskName;
    for (var j = i; j >= 0; j--) {
        if (newData[j].askComplete !== undefined || newData[j].taskName !== taskName) {
            break;
        }
        newData[j].askComplete = true;
    }
    send(newData[i]);
}

function done() {

    var i = newData.length - 1;
    if (i < 0) {
        console.info('Чтото не то. ');

        return null;
    }
    var taskName = newData[i].taskName;
    for (var j = i; j >= 0; j--) {
        if (newData[j].done !== undefined || newData[j].taskName !== taskName) {
            break;
        }
        newData[j].done = true;
    }
}

/**
 * Запуск следующей тестовой операции
 * @returns {null}
 */
function testNxtOperations() {
    carrentTask++;
    if (mode === 'complete') {
        return null;
    }
    var key = Object.keys(operations);
    send({
        type: 'task',
        task: key[carrentTask]
    });
}

/**
 * Запуск функции задания
 * @param {Object}message
 */
function answer(message) {
    console.info(message);
    operations[message.taskName](message);
}

/**
 * Передача сообщения
 * @param {Object}obj
 */
function send(obj) {
    if (obj === undefined) {
        obj = newData[newData.length - 1];
    }
    var js;
    if (obj.type === 'task' && (index < MAX && errIndex < MAX_ERROR)) {
        js = JSON.stringify(obj);
    } else {
        js = JSON.stringify({
            task: obj.taskName,
            type: 'answer',
            data: obj.output
        });
    }
    index++;
    console.info('output :' + js);
    ws.send(js);

}

/**
 * Задание Эхо
 * @param {Object}message
 */
function echo(message) {

    message.output = message.data;
    message.askComplete = true;
    newData.push(message);
    send(message);
}

/**
 * Задание обратная строка
 * @param {Object}message
 */
function reverse(message) {
    console.info('reverse');
    message.output = message.data.split('').reverse().join('');
    message.askComplete = true;
    newData.push(message);
    send(message);

}

/**
 * Задание Сумма
 * @param {Object}message
 */
function sum(message) {
    console.info('sum');
    var l = newData.length - 1;
    var prevSum = 0;
    if (l >= 0 && newData[l].taskName === 'sum' && newData[l].askComplete !== true) {
        prevSum = newData[l].output;
    }
    message.output = message.data + prevSum;
    newData.push(message);

}

/**
 * Задание Калькулятор
 * @param {Object}message
 */
function calc(message) {
    console.info('calc');

    message.output = calcMess(message.data); // eval(message.data);
    message.askComplete = true;
    newData.push(message);
    send(message);

}
var prec = {
    '*': 3,
    '+': 2
};

/**
 * Функция вычисления выражения состоящего из чисел + и *
 * Используется совмещенный алгоритм перевода в постфиксную форму
 * и вычисления выражения в постфиксной форме
 * @param {String}line
 * @returns {*}
 */
function calcMess(line) {
    if (!isNaN(Number(line))) {
        return Number(line);
    }
    var arr = line.split(' ');
    var i;
    var sOper = [];
    var sNum = [];
    for (i = 0; i < arr.length * 2; i++) {
        if (i > arr.length && sNum.length === 1) {
            return sNum.pop();
        }
        if (!isNaN(Number(arr[i])) && i < arr.length) {
            sNum.push(Number(arr[i]));
            continue;
        }
        if (sOper.length === 0) {
            sOper.push(arr[i]);
            continue;
        }
        if (i < arr.length && sOper.length !== 0 && prec[arr[i]] > prec[sOper[sOper.length - 1]]) {
            sOper.push(arr[i]);
        } else {
            var a = sNum.pop();
            var b = sNum.pop();
            var o = sOper.pop();
            if (o === '+') {
                sNum.push(a + b);
            } else {
                sNum.push(a * b);
            }
            if (i < arr.length) {
                sOper.push(arr[i]);
            }
        }

    }

    return null;
}


/**
 * Задание Медиана
 * @param {Object}message
 */
function median(message) {
    console.info('median');
    var l = newData.length - 1;
    var mdata = [];
    for (var i = l; i >= 0; i--) {
        if (newData[i].taskName !== 'median' && newData[i].askComplete === true) {
            break;
        }
        mdata.push(newData[i].data);

    }
    var fmedian = function (values) {
        values.sort(function (a, b) {
            return a - b;
        });
        var half = Math.floor(values.length / 2);

        return values[half];
    };
    mdata.push(message.data);
    message.output = fmedian(mdata);
    newData.push(message);
    send(message);
}

/**
 * Задание Группировка
 * @param {Object}message
 */
function groups(message) {
    console.info('groups');
    printTasks();
    var l = newData.length - 1;
    var groupData = [];
    if (newData[l].taskName === 'groups' && newData[l].askComplete !== true) {
        groupData = newData[l].output;
    }
    if (groupData[message.data.group] === undefined) {
        groupData[message.data.group] = [];
    }
    groupData[message.data.group].push(message.data.value);
    message.output = groupData;
    newData.push(message);

}

/**
 * Задание Поиск предыдущего аналогичного сообщения
 * @param {Object}message
 */
function recurrence(message) {
    console.info('recurrence');
    var l = newData.length - 1;
    var res = false;
    for (var t = l; t >= 0; t--) {
        if (newData[t].taskName !== 'recurrence' && newData[t].askComplete === true) {
            break;
            // не с чем больше сравнивать
        }
        res = checkPrev(message.data, newData[t].data);
        if (res) {
            // Если нашли - Заканчиваем
            break;
        }
    }
    message.output = res;
    newData.push(message);// Кладем текущее сообщение в историю
    send(message);
}

/**
 * Задание валидация сообщений
 * @param {Object}message
 * @returns {null}
 */
function validator(message) {
    console.info('validator');
    var l = newData.length - 1;
    if (newData[l].taskName !== 'validator' || newData[l].askComplete === true) {
        message.carrentValidation = parsValid(message.data);
        newData.push(message);

        return null;
    }
    newData[l].data = message.data;
    newData[l].output = [];
    for (var i = 0; i < message.data.length; i++) { // Перебираем все объекты в массиве данных
        var res = true;
        for (var j = 0; j < newData[l].carrentValidation.length; j++) {
            // Перебираем заданные параметры валидации
            var v = newData[l].carrentValidation[j].check;
            var newR = validation[v](message.data[i],
                newData[l].carrentValidation[j].n,
                newData[l].carrentValidation[j].str); // Запускаем валидациюю
            res = res && newR;
        }
        newData[l].output[i] = res;
    }

}

/**
 * Задание recurrence2, не работает
 * @param {Object}message
 */
function recurrence2(message) {
    console.info('recurrence2');
    var l = newData.length - 1;
    var res = false;
    for (var t = l; t >= 0; t--) {
        if (newData[t].taskName !== 'recurrence2' && newData[t].askComplete === true) {
            break;
            // не с чем больше сравнивать
        }
        res = checkPrev(message.data, newData[t].data);
        if (res) {
            // Если нашли - Заканчиваем
            break;
        }
    }
    message.output = res;
    newData.push(message);// Кладем текущее сообщение в историю
    send(message);
}

/**
 * Парсим пакет с параметрами для валидации
 * @param {object}md
 * @returns {object}
 */
function parsValid(md) {
    var carrentValidation = [];
    console.info('parsValid');

    for (var i = 0; i < md.length; i++) {
        for (var key in validation) {
            if (md[i].indexOf(key) !== -1) {
                carrentValidation[i] = {};
                carrentValidation[i].check = key;
                carrentValidation[i].n = Number(md[i].substring(key.length));
                carrentValidation[i].str = md[i].substring(key.length);

            }
        }
    }

    return carrentValidation;
}

function printTasks(j) {
    console.info('PRINTTASKS');
    if (j !== undefined) {
        console.info('LOG ' + j + '   ' + JSON.stringify(newData[j]));

        return;
    }
    console.info(newData.length);
    var l = newData.length;
    for (var i = 0; i < l; i++) {
        console.info('LOG ' + i + '   ' + JSON.stringify(newData[i]));
    }
}

/**
 * Сравниваем два объекта для поиска аналогичных пакетов в истории
 * Сравнение тупое, но с задачей справляется.
 * Переводим в Json, чистим строку от спецсимволов, разделяем в массив по словам,
 * сортируем,
 * и сравниваем 2 массива отсортированные
 *
 * @param {Object}x
 * @param {Objectt}y
 * @returns {boolean}
 */
function checkPrev(x, y) {
    if (x === y) {
        return true;
    }
    if (typeof (x) !== typeof (y)) {
        return false;
    }
    var sx = JSON.stringify(x);
    var sy = JSON.stringify(y);
    if (sx.length !== sy.length) {
        return false;
    }
    sx = sx.replace(/[",\+{}\[\]:]+/gi, ' ').split(' ').sort();
    sy = sy.replace(/[",\+{}\[\]:]+/gi, ' ').split(' ').sort();
    if (sx.length !== sy.length) {
        return false;
    }
    for (var i = 0; i < sx.length; i++) {
        if (sx[i] !== sy[i]) {
            return false;
        }
    }

    return true;

}

