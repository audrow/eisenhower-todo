import { Application } from "https://deno.land/x/oak/mod.ts"
import todoRouter from "./routes/todo-routes.ts"
import labelRouter from "./routes/label-routes.ts"
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

const routers = [todoRouter, labelRouter]
for (const router of routers) {
  app.use(router.routes())
  app.use(router.allowedMethods())
}

await app.listen({ port: 8000 })