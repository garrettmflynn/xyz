
document.addEventListener('DOMContentLoaded', () => {
    const h1 = document.querySelector('h1')!

    const small = document.createElement('small')
    small.textContent = 'Inserted with JavaScript'

    h1.insertAdjacentElement('afterend', small)

})