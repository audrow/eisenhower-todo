import { Router } from "https://deno.land/x/oak/mod.ts"
import { renderFileToString } from "https://deno.land/x/dejs/mod.ts"
import { Bson } from "https://deno.land/x/mongo@v0.22.0/mod.ts";
import getTodosCollection from "../helper/dbs.ts"

const router = new Router()

router.get('/', async (ctx, next) => {
  const todos = await getTodosCollection().find().toArray()
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
    const newTodo = { name: newTodoTitle! }
    await getTodosCollection().insertOne(newTodo)
    ctx.response.redirect('/')
  } else {
    const todos = await getTodosCollection().find().toArray()
    const body = await renderFileToString(Deno.cwd() + '/views/todos.ejs', {
      title: 'My Todos',
      todos: todos,
      error: "Field cannot be empty"
    })
    ctx.response.body = body
  }
})

router.post('/update-todo/:todoId', async (ctx) => {
  const id = new Bson.ObjectId(ctx.params.todoId!)
  const todo = await getTodosCollection().findOne({_id: id})
  if (!todo) {
    throw new Error('Did not find todo')
  }

  const updatedTodoTitle = (await ctx.request.body({type: "form"}).value).get('update-todo')
  if (updatedTodoTitle && updatedTodoTitle.trim().length !== 0) {
    todo!.name = updatedTodoTitle
    await getTodosCollection().updateOne({_id: id}, {$set: {name: updatedTodoTitle}})
    ctx.response.redirect('/')
  } else {
    const body = await renderFileToString(Deno.cwd() + '/views/todo.ejs', {
      todoText: todo!.name,
      todoId: todo!._id,
      error: "Field cannot be empty",
    })
    ctx.response.body = body
  }
})

router.post('/delete-todo/:todoId', async ctx => {
  const id = new Bson.ObjectId(ctx.params.todoId!)
  await getTodosCollection().deleteOne({_id: id})
  ctx.response.redirect('/')
})

router.get('/todo/:todoId', async (ctx) => {
  const id = new Bson.ObjectId(ctx.params.todoId!)
  const todo = await getTodosCollection().findOne({ _id: id })
  if (!todo) {
    throw new Error('Did not find todo')
  }
  const body = await renderFileToString(Deno.cwd()+'/views/todo.ejs', {
    todoText: todo!.name,
    todoId: todo!._id,
    error: null,
  })
  ctx.response.body = body
})

router.get('/about', (ctx, next) => {
  ctx.response.body = `<h1>about</h1>`
  ctx.response.type = 'text/html'
})

export default router