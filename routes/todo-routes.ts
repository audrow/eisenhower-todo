import { Router, send } from "https://deno.land/x/oak/mod.ts"
import { renderFileToString } from "https://deno.land/x/dejs/mod.ts"
import { Bson } from "https://deno.land/x/mongo@v0.22.0/mod.ts"
import { getTodosCollection, getLabelCollection } from "../helper/dbs.ts"

const router = new Router()
let isShowDoneTodos = false;

router.get('/', async (ctx, next) => {
  const todos = await getTodosCollection().aggregate(
    [{$sort: {isComplete: 1, modifiedDate: -1}}]).toArray()
  const labels = await getLabelCollection().aggregate(
    [{$sort: {name: 1}}]).toArray()
  const body = await renderFileToString(Deno.cwd() + '/views/pages/todos.ejs', 
    { 
      title: 'My Todos',
      todos,
      labels,
      isShowDoneTodos,
      error: null,
    })
  ctx.response.body = body
})

router.post('/add-todo', async (ctx, next) => {
  const form = await ctx.request.body({type: "form"}).value

  const newTodoTitle = form.get('new-todo')
  const isImportant: boolean = form.get('is-important') === "true"
  const isUrgent: boolean = form.get('is-urgent') === "true"

  const labelInput = form.get('label-id')!
  const labelId: string | undefined = (labelInput !== "") ? labelInput : undefined

  const dateInput = form.get('due-date')!
  const dueDate: Date | undefined = (dateInput !== "") ? new Date(dateInput) : undefined

  const creationDate = new Date()

  if(newTodoTitle && newTodoTitle.trim().length !== 0) {
    const newTodo = { 
      name: newTodoTitle!,
      labelId,
      isImportant,
      isUrgent,
      isComplete: false,
      creationDate,
      dueDate,
      modifiedDate: creationDate,
    }
    await getTodosCollection().insertOne(newTodo)
    ctx.response.redirect('/')
  } else {
    const todos = await getTodosCollection().find().toArray()
    const body = await renderFileToString(Deno.cwd() + '/views/pages/todos.ejs', {
      title: 'My Todos',
      todos,
      isShowDoneTodos,
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

  const form = await ctx.request.body({type: "form"}).value
  const updatedTodoTitle = form.get('update-todo')
  const isImportant: boolean = form.get('is-important') === "true"
  const isUrgent: boolean = form.get('is-urgent') === "true"
  const isComplete: boolean = form.get('is-complete') === "true"

  const dateInput = form.get('due-date')!
  const dueDate: Date | undefined = (dateInput !== "") ? new Date(dateInput) : undefined

  if (updatedTodoTitle && updatedTodoTitle.trim().length !== 0) {
    const currentDate = new Date
    await getTodosCollection().updateOne({_id: id}, {$set: {
      name: updatedTodoTitle!,
      isImportant,
      isUrgent,
      isComplete,
      dueDate,
      modifiedDate: currentDate,
    }})
    if (isComplete) {
      await getTodosCollection().updateOne({_id: id}, {$set: {
        completedDate: currentDate,
      }})
    } else {
      await getTodosCollection().updateOne({_id: id}, {$unset: {
        completedDate: "",
      }})
    }
    ctx.response.redirect('/')
  } else {
    const body = await renderFileToString(Deno.cwd() + '/views/pages/todo.ejs', {
      todo: todo!,
      error: "Field cannot be empty",
    })
    ctx.response.body = body
  }
})

router.post('/mark-todo-as-complete/:todoId', async ctx => {
  const id = new Bson.ObjectId(ctx.params.todoId!)
  const currentDate = new Date()
  await getTodosCollection().updateOne({_id: id}, {$set: { 
    isComplete: true ,
    completedDate: currentDate,
    modifiedDate: currentDate,
  }})
  ctx.response.redirect('/')
})

router.post('/mark-todo-as-incomplete/:todoId', async ctx => {
  const id = new Bson.ObjectId(ctx.params.todoId!)
  await getTodosCollection().updateOne({_id: id}, {
    $set: { 
      isComplete: false ,
      modifiedDate: new Date(),
    }, 
    $unset: {
      completedDate: "",
    },
  })
  ctx.response.redirect('/')
})

router.post('/toggle-hide-done-todos', ctx => {
  isShowDoneTodos = !isShowDoneTodos
  ctx.response.redirect('/')
})

router.post('/delete-todo/:todoId', async ctx => {
  const id = new Bson.ObjectId(ctx.params.todoId!)
  await getTodosCollection().deleteOne({_id: id})
  ctx.response.redirect('/')
})

router.get('/assets/:path+', async (ctx) => {
  await send(ctx, ctx.request.url.pathname, {
    root: Deno.cwd(),
  })
})

router.get('/todo/:todoId', async (ctx) => {
  const id = new Bson.ObjectId(ctx.params.todoId!)
  const todo = await getTodosCollection().findOne({ _id: id })
  if (!todo) {
    throw new Error('Did not find todo')
  }
  const body = await renderFileToString(Deno.cwd()+'/views/pages/todo.ejs', {
    todo: todo!,
    error: null,
  })
  ctx.response.body = body
})

router.get('/about', (ctx, next) => {
  ctx.response.body = `<h1>about</h1>`
  ctx.response.type = 'text/html'
})

export default router