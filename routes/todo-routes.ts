import { Router, send } from "https://deno.land/x/oak/mod.ts"
import { renderFileToString } from "https://deno.land/x/dejs/mod.ts"
import { Bson } from "https://deno.land/x/mongo@v0.22.0/mod.ts"
import { getTodosCollection, getLabelCollection, TodoSchema } from "../helper/dbs.ts"

const router = new Router()
let isShowDoneTodos = false;

type displayTodo = {
  name: string,
  _id: string,
  label: string | undefined,
  isImportant: boolean,
  isUrgent: boolean,
  dueDate: Date | undefined,
  completedDate: Date | undefined,
}

async function getDisplayTodos(todos: TodoSchema[]): Promise<displayTodo[]> {
  const labels = await getLabelCollection().aggregate(
    [{$sort: {name: 1}}]).toArray()

  const displayTodos: displayTodo[] = []
  for (const todo of todos) {
    let labelName: string | undefined = undefined
    if (todo.labelId) {
      for (const label of labels) {
        if (todo.labelId.toString() === label._id.toString()) {
          labelName = label.name
        }
      }
    }
    const displayTodo: displayTodo = {
      name: todo.name,
      _id: todo._id.toString(),
      label: labelName,
      isImportant: todo.isImportant,
      isUrgent: todo.isUrgent,
      dueDate: todo.dueDate,
      completedDate: todo.completedDate,
    }
    displayTodos.push(displayTodo)
  }
  return displayTodos
}

async function getTodosPage(error: null | string = null): Promise<string> {
  const dbTodos = await getTodosCollection().aggregate(
    [{$sort: {isComplete: 1, modifiedDate: -1}}]).toArray()
  const todos = await getDisplayTodos(dbTodos)
  const labels = await getLabelCollection().aggregate(
    [{$sort: {name: 1}}]).toArray()
  return await renderFileToString(Deno.cwd() + '/views/pages/todos.ejs',
    {
      title: 'My Todos',
      todos,
      labels,
      isShowDoneTodos,
      error,
    })
}

async function getTodoPage(todoId: string, error: null | string = null): Promise<string> {
  const id = new Bson.ObjectId(todoId)
  const dbTodo = await getTodosCollection().findOne({ _id: id })
  const todos = await getDisplayTodos([dbTodo!])
  const labels = await getLabelCollection().aggregate(
    [{$sort: {name: 1}}]).toArray()
  if (todos.length !== 1) {
    throw new Error('Did not find todo')
  }
  return await renderFileToString(Deno.cwd()+'/views/pages/todo.ejs', {
    todo: todos[0],
    labels,
    error,
  })
}

router.get('/', async (ctx, next) => {
  ctx.response.body = await getTodosPage(null)
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
    ctx.response.body = await getTodosPage("Field cannot be empty")
  }
})

router.post('/update-todo/:todoId', async (ctx) => {
  const todoId = ctx.params.todoId!
  const id = new Bson.ObjectId(todoId)
  const todo = await getTodosCollection().findOne({_id: id})
  if (!todo) {
    throw new Error('Did not find todo')
  }

  const form = await ctx.request.body({type: "form"}).value
  const updatedTodoTitle = form.get('update-todo')
  const isImportant: boolean = form.get('is-important') === "true"
  const isUrgent: boolean = form.get('is-urgent') === "true"
  const isComplete: boolean = form.get('is-complete') === "true"

  const labelInput = form.get('label-id')!
  const labelId: string | undefined = (labelInput !== "") ? labelInput : undefined

  const dateInput = form.get('due-date')!
  const dueDate: Date | undefined = (dateInput !== "") ? new Date(dateInput) : undefined

  if (updatedTodoTitle && updatedTodoTitle.trim().length !== 0) {
    const currentDate = new Date
    await getTodosCollection().updateOne({_id: id}, {$set: {
      name: updatedTodoTitle!,
      isImportant,
      isUrgent,
      isComplete,
      labelId,
      dueDate,
      modifiedDate: currentDate,
    }})
    if (isComplete) {
      await getTodosCollection().updateOne({_id: id}, {$set: { completedDate: currentDate }})
    } else {
      await getTodosCollection().updateOne({_id: id}, {$unset: { completedDate: "" }})
    }
    if (labelId) {
      await getTodosCollection().updateOne({_id: id}, {$set: { labelId }})
    } else {
      await getTodosCollection().updateOne({_id: id}, {$unset: { labelId: "" }})
    }
    ctx.response.redirect('/')
  } else {
    ctx.response.body = await getTodoPage(todoId, "Field cannot be empty")
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
  ctx.response.body = await getTodoPage(ctx.params.todoId!, null)
})

export default router