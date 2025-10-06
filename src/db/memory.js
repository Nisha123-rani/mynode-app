// src/db/memory.js
const todos = new Map();

export const listTodos = async () => {
  return Array.from(todos.values());
};

export const createTodo = async (item) => {
  todos.set(item.id, item);
  return item;
};

// helper for tests / reset
export const _clear = () => {
  todos.clear();
};

// default export (so `import DB from '../db/index.js'` works)
export default { listTodos, createTodo, _clear };

