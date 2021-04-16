DESIGN_NOTES
============

2021-04-15: Many-to-many todos and tags
---------------------------------------

I would like to enable a many-to-many relationship between the todos and tags (formerly, "labels").
The reasons for this are as follows:
* I can select multiple tags per todo, which makes sense when todos don't fit neatly into one tag
* I can list todos that have specific tags, for filtering

A question is if I want todos to have tags, tags have todos, or both.
It is likely easier to maintain if only one of these relationships is true.
This also makes it so that tags don't have to know about labels in any sense, which is a better separation.

In implementing this, I can really leverage MongoDB.
Here are some notes on functions that are likely to be useful:

* I can use MongoDB to populate labels in a todo as follows
  ```
  db.test.aggregate([{$match: {_id: ObjectId("607917a4823c4edab2757214")}}, {$lookup: {from: "labels", localField: "labels", foreignField: "_id", as: "labelInfo"}}]).pretty()
  ```
  Or you can get just the fields that you want with `$project`:
  ```
  db.test.aggregate([{$match: {_id: ObjectId("607917a4823c4edab2757214")}}, {$lookup: {from: "labels", localField: "labels", foreignField: "_id", as: "labelInfo"}}, {$project: {name: 1, labelInfo: {name:1, _id: 1}}}]).pretty()
  ```

* I can find all entries with a specific label as follows:
  ```
  db.test.find({labels: ObjectId("6071210d519326a454f9766a")}).pretty()
  ```
