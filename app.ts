import { Application } from "https://deno.land/x/oak/mod.ts"
import router from "./routes/todo-routes.ts"
import { connect } from "./helper/dbs.ts"

await connect()
const app = new Application()

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    console.log(err)
  }
})

app.use(router.routes())
app.use(router.allowedMethods())

await app.listen({ port: 8000 })