
const Mask = {
  apply(input, func) {
    setTimeout(function() {
      input.value = Mask[func](input.value)
    }, 1)

  },
  formatAKZ(value) {
    
    value = value.replace(/\D/g,"")

    return value = new Intl.NumberFormat('pt-AO', {
      style: 'currency', 
      currency: 'AKZ'
    }).format(value/100)
    
    e.target.value = value
  }
}
