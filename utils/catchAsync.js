//Функция для обработки ошибок в асинхронных функциях, возвращает обертку, которая вызывает
//асинхронную функцию и при возвращении промисом rejected вызывает мидлвару с ошибкой
module.exports = fn => (req, res, next) => fn(req, res, next).catch(next);