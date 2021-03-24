import { Router } from "https://deno.land/x/oak/mod.ts"
import { renderFileToString } from "https://deno.land/x/dejs/mod.ts"

const router = new Router()

let todos: {id: String, name: String }[] = [
  {id: "1", name: "Learn Deno"},
  {id: "2", name: "Make app"},
  {id: "3", name: "Drink milk"},
]

router.get('/', async (ctx, next) => {
  const body = await renderFileToString(Deno.cwd() + '/views/todos.ejs', 
    { 
      title: 'My Todos',
      todos: todos,
      error: null,
    })
  ctx.response.body = body
})

router.post('/add-todo', async (ctx, next) => {
  const newTodoTitle = (await ctx.request.body({type: "form"}).value).get('new-todo')
  if(newTodoTitle && newTodoTitle.trim().length !== 0) {
    const newTodo = {
      id: new Date().toISOString(),
      name: newTodoTitle,
    }
    todos.push(newTodo)
    console.log(newTodo)
    ctx.response.redirect('/')
  } else {
    const body = await renderFileToString(Deno.cwd() + '/views/todos.ejs', {
      title: 'My Todos',
      todos: todos,
      error: "Field cannot be empty"
    })
    ctx.response.body = body
  }
})

router.post('/update-todo/:todoId', async (ctx) => {
  const id = ctx.params.todoId
  const todo = todos.find(todo => todo.id === id)
  if (!todo) {
    throw new Error('Did not find todo')
  }

  const updatedTodoTitle = (await ctx.request.body({type: "form"}).value).get('update-todo')

  if (updatedTodoTitle && updatedTodoTitle.trim().length !== 0) {
    todo.name = updatedTodoTitle
    ctx.response.redirect('/')
  } else {
    const body = await renderFileToString(Deno.cwd() + '/views/todo.ejs', {
      todoText: todo.name,
      todoId: todo.id,
      error: "Field cannot be empty",
    })
    ctx.response.body = body
  }
})

router.post('/delete-todo/:todoId', ctx => {
  const id = ctx.params.todoId
  todos = todos.filter(todo => todo.id !== id)
  ctx.response.redirect('/')
})

router.get('/todo/:todoId', async (ctx) => {
  const id = ctx.params.todoId

  const todo = todos.find(todo => todo.id === id)
  if (!todo) {
    throw new Error('Did not find todo')
  }
  const body = await renderFileToString(Deno.cwd()+'/views/todo.ejs', {
    todoText: todo.name,
    todoId: todo.id,
    error: null,
  })
  ctx.response.body = body
})

router.get('/about', (ctx, next) => {
  ctx.response.body = `<h1>about</h1>`
  ctx.response.type = 'text/html'
})

export default router