import { Router, send } from "https://deno.land/x/oak/mod.ts"
import { renderFileToString } from "https://deno.land/x/dejs/mod.ts"
import { Bson } from "https://deno.land/x/mongo@v0.22.0/mod.ts"
import { getLabelCollection } from "../helper/dbs.ts"

const router = new Router()

router.get('/labels', async ctx => {
  const labels = await getLabelCollection().aggregate(
    [{$sort: {name: 1}}]).toArray()
  const body = await renderFileToString(Deno.cwd() + '/views/pages/labels.ejs', {
    labels,
    error: null,
  })
  ctx.response.body = body
})

router.post('/add-label', async (ctx, next) => {
  const form = await ctx.request.body({type: "form"}).value

  const newLabelTitle = form.get('new-label')
  const creationDate = new Date()

  if(newLabelTitle && newLabelTitle.trim().length !== 0) {
    const newLabel = { 
      name: newLabelTitle!,
      creationDate,
    }
    await getLabelCollection().insertOne(newLabel)
    ctx.response.redirect('/labels')
  } else {
    const labels = await getLabelCollection().find().toArray()
    const body = await renderFileToString(Deno.cwd() + '/views/pages/labels.ejs', {
      labels,
      error: "Label cannot be empty"
    })
    ctx.response.body = body
  }
})

router.get('/label/:labelId', async (ctx) => {
  const id = new Bson.ObjectId(ctx.params.labelId!)
  const label = await getLabelCollection().findOne({ _id: id })
  if (!label) {
    throw new Error('Did not find label')
  }
  const body = await renderFileToString(Deno.cwd()+'/views/pages/label.ejs', {
    label,
    error: null,
  })
  ctx.response.body = body
})


router.post('/delete-label/:labelId', async ctx => {
  const id = new Bson.ObjectId(ctx.params.labelId!)
  await getLabelCollection().deleteOne({_id: id})
  ctx.response.redirect('/labels')
})

router.post('/update-label/:labelId', async (ctx) => {
  const id = new Bson.ObjectId(ctx.params.labelId!)
  const label = await getLabelCollection().findOne({_id: id})
  if (!label) {
    throw new Error('Did not find label')
  }

  const form = await ctx.request.body({type: "form"}).value
  const updatedLabelTitle = form.get('update-label')

  if (updatedLabelTitle && updatedLabelTitle.trim().length !== 0) {
    const currentDate = new Date
    await getLabelCollection().updateOne({_id: id}, {$set: {
      name: updatedLabelTitle!,
      modifiedDate: currentDate,
    }})
    ctx.response.redirect('/labels')
  } else {
    const body = await renderFileToString(Deno.cwd() + '/views/pages/label.ejs', {
      label: label!,
      error: "Label cannot be empty",
    })
    ctx.response.body = body
  }
})

export default router