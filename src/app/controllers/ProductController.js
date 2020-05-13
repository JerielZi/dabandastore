const { formatPrice, date } = require('../../lib/utils')

const Category = require('../models/Category')
const Product = require('../models/Product')
const File = require('../models/File')

module.exports = {
  create(req, res) {
    //Pegar Categorias Com "PROMISES"
    Category.all()
    .then(function(results) {
        const categories = results.rows
        return res.render("products/create.njk", { categories })
    }).catch(function(err) {
      throw new Error(err)
    })

  },
  async post(req, res) {
    //Lógica de Salvar
    const keys = Object.keys(req.body)

    for(key of keys) {
      //req.body.key == ""
      if (req.body[key] == "") {
        return res.send('Please, fill all the fields!')
      }
    }

    // Configurações para armazenamento de imagens
    if (req.files.length == 0)
      return res.sen('Please, send at least one image')

    let results = await Product.create(req.body)
    const productId = results.rows[0].id
    //Array de promessas, para aguardar a criação da imagem e depois de esperar
    //Redireciona então para a página indicada depois das imagens criadas.
    const filesPromise = req.files.map(file => File.create({...file, product_id: productId
    }))
    await Promise.all(filesPromise)

    return res.redirect(`/products/${productId}`)
    
  },
  async show(req, res) {

    let results = await Product.find(req.params.id)
    const product = results.rows[0]

    if (!product) return res.send("Product not found!")

    const { day, hour, minutes, month } = date(product.updated_at)
    
    product.published = {
      day: `${day}/${month}`,
      hour: `${hour}h${minutes}`, 
      minutes,
      month
    }

    product.old_price = formatPrice(product.old_price)
    product.price = formatPrice(product.price)

    // Imagens dos produtos
    results = await Product.files(product.id)
    const files = results.rows.map(file =>({
      ...file,
      src:`${req.protocol}://${req.headers.host}${file.path.replace("public", "")}`
    }))


    return res.render("products/show", { product, files })
  },
  async edit(req, res) {
    let results = await Product.find(req.params.id)

    const product = results.rows[0]

    if (!product) return res.send("Product not found!")

    product.old_price = formatPrice(product.old_price) 
    product.price = formatPrice(product.price) 

    //Get categories
    results = await Category.all()
    const categories = results.rows

    //Get images
    results = await Product.files(product.id)
    let files = results.rows
    files = files.map(file =>({
      ...file,
      src:`${req.protocol}://${req.headers.host}${file.path.replace("public", "")}`
    }))


    return res.render('products/edit.njk', { product, categories, files })
  },
  async put(req, res) {
    const keys = Object.keys(req.body)

    for(key of keys) {
      //req.body.key == ""
      //"removed_files" entra aqui para garantir que array onde estão
      //a ir as imagens deletadas possa passar como vazio, os outros 
      //precisam ser preenchidos
      if (req.body[key] == "" && key != "removed_files") {
        return res.send('Please, fill all the fields!')
      }
    }

    if (req.files.length != 0) {
      const newFilesPromise = req.files.map(file => 
        File.create({...file, product_id: req.body.id}))

      await Promise.all(newFilesPromise)
    }


    if (req.body.removed_files) {
      const removedFiles = req.body.removed_files.split(",") //[1,2,3,]
      const lastIndex = removedFiles.length - 1 //Para remover a virgula que há na última posição do array
      removedFiles.splice(lastIndex, 1) // Retorna o array já sem a vírgula[1,2,3]

      //Array de Promisses
      const removedFilesPromise = removedFiles.map(id => File.delete(id))

      await Promise.all(removedFilesPromise)
    }


    req.body.price = req.body.price.replace(/\D/g, "")

    if (req.body.old_price != req.body.price ) {
      const oldProduct = await Product.find(req.body.id)

      req.body.old_price = oldProduct.rows[0].price
    }

    await Product.update(req.body)

    return res.redirect(`/products/${req.body.id}`)

  }, 
  async delete(req, res) {
    await Product.delete(req.body.id)

    return res.redirect('/products/create')
  }
}