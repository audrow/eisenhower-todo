import { MongoClient } from "https://deno.land/x/mongo@v0.22.0/mod.ts";
import { Collection } from "https://deno.land/x/mongo@v0.22.0/src/collection/collection.ts"

interface TodoSchema {
  _id: { $oid: string },
  name: string,
  isComplete: boolean,
  isImportant: boolean,
  isUrgent: boolean,
  createdDate: Date,
  modifiedDate: Date,
  dueDate: Date | undefined,
  completedDate: Date | undefined,
}

interface LabelSchema {
  _id: { $oid: string },
  name: string,
  createdDate: Date,
}

let todosCollection: Collection<TodoSchema>
let labelCollection: Collection<LabelSchema>

export async function connect() {
  const client = new MongoClient()
  await client.connect("mongodb://localhost:62345")

  const db = client.database("todos")
  todosCollection = db.collection<TodoSchema>("todos")
  labelCollection = db.collection<TodoSchema>("labels")
}

export function getTodosCollection() {
  return todosCollection
}
export function getLabelCollection() {
  return labelCollection
}

export default getTodosCollection
