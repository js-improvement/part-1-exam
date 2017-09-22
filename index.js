'use strict';

var ws = new WebSocket('wss://part-1-task-1.herokuapp.com');
// var ws = new WebSocket('ws://localhost:8080');

var MAX = 20;
var MAX_ERROR = 5;
var index = 0;
var errIndex = 0;
var log = [];
var carrentTask = 7;
var carrentAnswer;
var carrentValidation;
var mode = 'complete';
var data;

// объект с функциями заданий
var operations = {
    echo: function (message) {
        echo(message);
    },
    reverse: function (message) {
        reverse(message);
    },
    sum: function (message) {
        sum(message);
    },
    calc: function (message) {
        calc(message);
    },
    median: function (message) {
        median(message);
    },
    groups: function (message) {
        groups(message);
    },
    recurrence: function (message) {
        recurrence(message);
    },
    validator: function (message) {
        validator(message);
    },
    recurrence2: function (message) {
        recurrence2(message);
    }
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
        for (var i = 2; i < n; i++) {
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
};

ws.onerror = function (e) {
    console.info('error' + errIndex, e);
    var message = JSON.parse(e);
    log.push(message);
    errIndex++;
};

ws.onclose = function (e) {
    console.info('close', e);
    var message = JSON.parse(e.reason);
    if (e.reason.length > 0) {
        log.push(message);
    }
    printLog();
    if (message.message === 'Timeout to answer 1000ms') {
        ws = new WebSocket('wss://part-1-task-1.herokuapp.com');
    }
};

ws.onmessage = function (e) {
    var message = JSON.parse(e.data);
    log.push(message);
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
        testNxtOperations();
        clear();
    }
    if (message.type === 'askComplete') {
        send(carrentAnswer);
        clear();
    }

};

/**
 *  Очистка глобальных переменных
 */
function clear() {
    carrentAnswer = undefined;
    carrentValidation = undefined;
    data = undefined;
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
    carrentAnswer = undefined;
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
    if (obj.type === 'answer' || (index < MAX && errIndex < MAX_ERROR)) {
        index++;
        var js = JSON.stringify(obj);
        console.info('output :' + js);
        log.push(js);
        ws.send(js);
    }
}

/**
 * Задание Эхо
 * @param {Object}message
 */
function echo(message) {
    send({ task: 'echo',
        type: 'answer',
        data: message.data });
}

/**
 * Задание обратная строка
 * @param {Object}message
 */
function reverse(message) {
    console.info('reverse');
    send({ task: 'reverse',
        type: 'answer',
        data: message.data.split('').reverse().join('') });
}

/**
 * Задание Сумма
 * @param {Object}message
 */
function sum(message) {
    console.info('sum');
    if (carrentAnswer === undefined) {
        carrentAnswer = { task: 'sum',
            type: 'answer',
            data: message.data };
    } else {
        carrentAnswer.data = carrentAnswer.data + message.data;
    }

}

/**
 * Задание Калькулятор
 * @param {Object}message
 */
function calc(message) {
    console.info('calc');
    send({ task: 'calc',
        type: 'answer',
        data: eval(message.data) });
}

/**
 * Задание Медиана
 * @param {Object}message
 */
function median(message) {
    console.info('median');
    if (carrentAnswer === undefined) {
        carrentAnswer = { task: 'median',
            type: 'answer',
            data: [message.data] };
    } else {
        carrentAnswer.data.push(message.data);
    }
    var fmedian = function (values) {
        values.sort(function (a, b) {
            return a - b;
        });
        var half = Math.floor(values.length / 2);

        return values[half];
    };
    send({ task: 'median',
        type: 'answer',
        data: fmedian(carrentAnswer.data) });
}

/**
 * Задание Группировка
 * @param {Object}message
 */
function groups(message) {
    console.info('groups');

    if (carrentAnswer === undefined) {
        carrentAnswer = { task: 'groups',
            type: 'answer',
            data: [] };
    }
    if (carrentAnswer.data[message.data.group] === undefined) {
        carrentAnswer.data[message.data.group] = [];
    }
    carrentAnswer.data[message.data.group].push(message.data.value);

}

/**
 * Задание Поиск предыдущего аналогичного сообщения
 * @param {Object}message
 */
function recurrence(message) {
    console.info('recurrence');
    if (data === undefined) { // Задаем массив пустой
        data = [];
    }
    var res = false;
    for (var i = 0; i < data.length; i++) {
        // Сравнение со всеми эллементами массива прошлых сообщений
        res = checkPrev(message.data, data[i]);
        if (res) {
            // Если нашли - Заканчиваем
            break;
        }
    }
    send({ task: 'recurrence',
        type: 'answer',
        data: res });
    data.push(message.data); // Кладем текущее сообщение в историю
}

/**
 * Задание валидация сообщений
 * @param {Object)message
 * @returns {null}
 */
function validator(message) {
    if (carrentValidation === undefined) { // проверяем, определены ли параметры валидации.
        parsValid(message.data); // если нет, то первое сообщение - параметры

        return null; // Завершаем обработку первого сообщения
    }
    carrentAnswer = { task: 'validator', // Шаблон ответа
        type: 'answer',
        data: [] };


    for (var i = 0; i < message.data.length; i++) { // Перебираем все объекты в массиве данных
        var res = true;
        for (var j = 0; j < carrentValidation.length; j++) {
            // Перебираем заданные параметры валидации
            var v = carrentValidation[j].check;
            var n = carrentValidation[j].n;
            var str = carrentValidation[j].str;
            var newR = validation[v](message.data[i], n, str); // Запускаем валидациюю
            res = res && newR;
        }
        carrentAnswer.data[i] = res;
    }
    carrentValidation = undefined;

}

/**
 * Задание recurrence2, не работает
 * @param {Object}message
 */
function recurrence2(message) {
    console.info('recurrence2');

    if (carrentAnswer === undefined) {
        carrentAnswer = { task: 'recurrence2',
            type: 'answer',
            data: [] };
    }

    var res = false;
    for (var i = 0; i < carrentAnswer.data.length; i++) {
        res = checkPrev(message.data, carrentAnswer.data[i]);
        if (res) {

            break;
        }
    }
    send({ task: 'recurrence2',
        type: 'answer',
        data: res });
    carrentAnswer.data.push(message.data);
}

/**
 * Парсим пакет с параметрами для валидации
 * @param {object}md
 */
function parsValid(md) {
    carrentValidation = [];
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

}

/**
 * Функция вывода Лога на экран
 * @param {number}j
 */
function printLog(j) {
    if (j !== undefined) {
        console.info('LOG ' + j + '   ' + JSON.stringify(log[j]));

        return;
    }
    var l = log.length;
    for (var i = 0; i < l; i++) {
        console.info('LOG ' + i + '   ' + JSON.stringify(log[i]));
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
    var sx = JSON.stringify(x);
    var sy = JSON.stringify(y);
    if (sx.length !== sy.length) {
        return false;
    }
    sx = sx.replace(/[",{}\[\]:]+/gi, ' ').split(' ').sort();
    sy = sy.replace(/[",{}\[\]:]+/gi, ' ').split(' ').sort();
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

