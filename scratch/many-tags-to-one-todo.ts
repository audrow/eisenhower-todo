import { MongoClient } from "https://deno.land/x/mongo@v0.22.0/mod.ts"


interface TodoSchema {
  _id: { $oid: string },
  name: string,
  dueDate: Date | undefined,
  isImportant: boolean,
  isUrgent: boolean,
  isComplete: boolean,
  tagIds: { $oid: string }[],
  completedDate: Date | undefined,
  createdDate: Date,
  modifiedDate: Date,
  tags: undefined | {
    _id: { $oid: string },
    name: string,
  }[],
}

interface DisplayTodo {
  _id: { $oid: string },
  name: string,
  dueDate: Date | undefined,
  isImportant: boolean,
  isUrgent: boolean,
  isComplete: boolean,
  tags: undefined | {
    _id: { $oid: string },
    name: string,
  }[],
}

interface TagSchema {
  _id: { $oid: string },
  name: string,
  createdDate: Date,
}

const client = new MongoClient()
await client.connect("mongodb://localhost:62345")

const db = client.database("todos")
const todoCollection = db.collection<TodoSchema>("todos")
const tagCollection = db.collection<TagSchema>("tags")

const tagInsertIds = (await tagCollection.insertMany([
  {
    name: "label 1",
    createdDate: Date.now(),
  },
  {
    name: "label 2",
    createdDate: Date.now(),
  },
]))!.insertedIds

/*
console.log(tagInsertIds[0])
console.log(
  await tagCollection.findOne({
    _id: tagInsertIds[1]
  })
)
*/

const todoInsertId = await todoCollection.insertOne({
  name: "myTodo",
  isImportant: true,
  isUrgent: true,
  isComplete: false,
  tagIds: tagInsertIds,
  createdDate: Date.now(),
  modifiedDate: Date.now(),
})

const displayTodos = await todoCollection.aggregate(
  [
    {
      $match: {
        _id: todoInsertId,
      }
    },
    {
      $lookup: {
        from: "tags",
        localField: "tagIds",
        foreignField: "_id",
        as: "tags"
      }
    },
    {
      $project: {
        name: 1,
        tags: {
          name:1,
          _id: 1
        },
        isImportant: 1,
        isUrgent: 1,
        isComplete: 1,
        dueDate: 1,
        completedDate: 1,
      }
    },
  ]
)


const displayTodo = await displayTodos.next() as DisplayTodo
//console.log(displayTodo)

console.log(displayTodo!.tags![0])
console.log(
  await tagCollection.findOne({
    _id: displayTodo!.tags![0]._id
  })
)

await todoCollection.deleteMany({})
await tagCollection.deleteMany({})