import { MongoClient } from "https://deno.land/x/mongo@v0.22.0/mod.ts";
import { Collection } from "https://deno.land/x/mongo@v0.22.0/src/collection/collection.ts"

interface TodoSchema {
  _id: { $oid: string },
  name: string,
  isImportant: boolean,
  isUrgent: boolean,
}

let todosCollection: Collection<TodoSchema>

export async function connect() {
  const client = new MongoClient()
  await client.connect("mongodb://localhost:62345")

  const db = client.database("todos")
  todosCollection = db.collection<TodoSchema>("todos")
}

function getTodosCollection() {
  return todosCollection
}

export default getTodosCollection
