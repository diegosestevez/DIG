const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const mongooseModels = require('./model');
const categoryModel = mongooseModels.categoryModel;

mongoose.connect('mongodb://localhost:27017/digDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify:false});

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set("view engine", "ejs");

//Multer storage disk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});

const upload = multer({ storage: storage });

//GET routes
//Retrieves the categories from 'categories' collection in Mongodb to display on home route
app.get('/', (req, res) => {
	categoryModel.find({}, (err, categories) => {
		if (!err) {
			res.render('index', {categories: categories });
		}
	});
});

//Retrieves the categories from 'categories' collection in Mongodb to display in table in managecategories route
app.get('/managecategories', (req, res) => {
	categoryModel.find({}, (err, categories) => {
			res.render('managecategories', { categories: categories });
	});
});


//Finds the matching category from 'categories' collection in Mongodb and passes data to display in update route
app.get('/managecategories/:update', (req, res) => {
  const categoryToUpdate = req.params.update;

  categoryModel.findOne({title:categoryToUpdate}, (err, foundCategory) => {
    res.render('updatecategory',
    {
      title: foundCategory.title,
      desc: foundCategory.desc
    });
  })
});

//Retrieves the categories in 'categories' collection in Mongodb and passes data to display on manageimages route
app.get("/manageimages/:categoryname", (req,res) => {
  const categoryName = req.params.categoryname;

  categoryModel.findOne({title:categoryName}, (err, foundCategory) => {
    const categorySubDoc = foundCategory.images;

    res.render("manageimages", {
        categoryname: categoryName,
        images: categorySubDoc
      });
  });
});

//Retrieves the categories in 'categories' collection in Mongodb to display on custom route which displays the name of the category
app.get("/:categoryname", (req,res) => {
  const categoryName = req.params.categoryname;

  categoryModel.findOne({title:categoryName}, (err, foundCategory)=> {
    const categorySubDoc = foundCategory.images;

    res.render("image", {
        categoryname: categoryName,
        images: categorySubDoc
      });
  });
});

//POST routes
//Updates category data in "categories" collection from Mongodb
app.post("/updatecategory", (req, res) => {
  const findCategory = req.body.hidden;
  const updateCategory =
  {
    title:req.body.title,
    desc:req.body.desc,
  }

categoryModel.findOneAndUpdate({title:findCategory}, {$set:updateCategory}, (err , docs) => {
    if(!err){
      res.redirect("/managecategories");
    }
  });
});

//deletes a matching document from "categories" collection in Mongodb. This deletes a target category.
app.post("/deletecategory", (req, res) => {
  const categoryToDelete = req.body.delete;
  categoryModel.deleteOne({title: categoryToDelete}, (err) => {
    res.redirect("/managecategories");
  });
});

//deletes a subdocument from inside the array of a target document in the cateogires "collection". Deletes an image inside a category
app.post("/deleteimage" , (req, res) => {
 const imageToDelete = req.body.delete;
 const categoryToReplaceImage = req.body.hidden;
 categoryModel.findOneAndUpdate({title:categoryToReplaceImage}, {$pull:{images:{title: imageToDelete}}}, (err, docs) => {
    res.redirect("/manageimages" + "/" + categoryToReplaceImage);
 });
});

//Create a new category and image from within the "managecategories" route. This creates a new document in the "categories" collection along with an image subdocument inside an array
app.post('/', upload.single('image'), (req, res, next) => {
  const imageObject = {
    title: req.body.imageTitle,
    desc: req.body.imageDesc,
    img: {
			data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
			contentType: 'image/png'
		},
  }

  const categoryObject = {
		title: req.body.title,
		desc: req.body.desc,
    images: imageObject
	}

categoryModel.findOne({title:req.body.title}, (err, foundCategory) => {
  if(foundCategory){
    res.send("This category already exists. Please pick a different name!");
  }else{
      if(!err){
        categoryModel.create(categoryObject, (err, item) => {
          if (!err) {
            res.redirect('/managecategories');
          }
        });
      }
    }
  });
});

//Uploads a single image, title and discription into the array of the target document in the 'categories' collection inside Mongodb.
app.post("/:categoryname", upload.single('image'), (req, res, next) => {
  const searchInCategory = req.body.hidden;
  const imageObject = {
    title: req.body.title,
    desc: req.body.desc,
    img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png'
    },
  }

categoryModel.findOneAndUpdate({title:searchInCategory},{$push:{images:imageObject}}, (err) => {
  res.redirect("/manageimages" + "/" + searchInCategory);
  });
});


app.listen(3000, () =>{
  console.log("server has started on port 3000");
});
