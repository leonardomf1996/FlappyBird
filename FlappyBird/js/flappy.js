function novoElemento (tagName, className) {
    // função para criar elementos (tagName informa qual elemento é e className indica a classe a ser utilizada na tag)
    const elem = document.createElement(tagName)
    elem.className = className
    return elem
}

function Barreira (reversa = false) {
    // função construtora para criar as barreiras do game
    // existe dois tipos de barreiras: a de baixo (normal) e a de cima (que seria a reversa)
    // a função recebe o parametro e verifica qual tipo de barreira é. Dependendo de qual for, a montagem dela (cano e borda) será diferente na sequencia
    // Barreira com B pois será uma função a ser instanciada, para ter mais de uma barreira
    
    this.elemento = novoElemento('div', 'barreira') // dentro da barreira teremos um this.elemento, que é de fato o elemento que foi criado com a função acima desta ( com o document.createElement() )

    const borda = novoElemento('div', 'borda')
    const corpo = novoElemento('div', 'corpo')
    this.elemento.appendChild(reversa ? corpo : borda) // aqui construímos a barreira, verificando se ela é reversa ou não (de qual lado ela estará)
    this.elemento.appendChild(reversa ? borda : corpo) // 

    this.setAltura = altura => corpo.style.height = `${altura}px` // para definir o tamanho de cada barreira
}

function ParDeBarreiras(altura, abertura, x) {
    // Função construtora que cria o par de barreiras, passando como parametro a altura delas, a abertura (onde o pássaro passa) e a distancia que terá da proxima
    this.elemento = novoElemento('div', 'par-de-barreiras')

    // barreiras de cima e de baixo
    this.superior = new Barreira(true)
    this.inferior = new Barreira(false)

    // add as barreiras na div que contem a classe 'par-de-barreiras'
    this.elemento.appendChild(this.superior.elemento)
    this.elemento.appendChild(this.inferior.elemento)

    this.sortearAbertura = () => {
        const alturaSuperior = Math.random() * (altura - abertura)
        const alturaInferior = altura - abertura - alturaSuperior

        this.superior.setAltura(alturaSuperior)
        this.inferior.setAltura(alturaInferior)
    }

    // Função para descobrir aonde a barreira foi posicionada
    this.getX = () => parseInt(this.elemento.style.left.split('px')[0])
    // Função para fazer o par de barreiras se locomover
    this.setX = x => this.elemento.style.left = `${x}px`
    // Função para descobrir a largura do game
    this.getLargura = () => this.elemento.clientWidth    

    this.sortearAbertura()
    this.setX(x)
}

function Barreiras(altura, largura, abertura, espaco, notificarPonto) {
    // Função construtora para criar múltiplas barreiras que terão no game
    // Recebe: altura do game, largura do game, abertura entre as barreiras, espaco entre as barreiras, notificarPonto é uma função que contabiliza os pontos (qndo as barreiras ultrapassarem o meio da tela, conta +1)

    this.pares = [
        // Pares de barreiras do game
        new ParDeBarreiras(altura, abertura, largura),
        new ParDeBarreiras(altura, abertura, largura + espaco),
        new ParDeBarreiras(altura, abertura, largura + espaco * 2),
        new ParDeBarreiras(altura, abertura, largura + espaco * 3),
    ]

    const deslocamento = 3 // barreiras se deslocam de 3 em 3 px

    this.animar = () => {
        this.pares.forEach(par => {
            par.setX(par.getX() - deslocamento)

            // quando o elemento sair da área do game
            if (par.getX() < -par.getLargura() ) {
                par.setX(par.getX() + espaco * this.pares.length) // qndo a barreira sair da área do game, ela retorna atrás da ultima barreira, já contando o espaço entre elas
                par.sortearAbertura()
            }

            const meio = largura / 2 // para verificar se a barreira cruzou o meio
            const cruzouOMeio = par.getX() + deslocamento >= meio && par.getX() < meio
            if (cruzouOMeio) notificarPonto()
        })
    }
}

function Passaro (alturaJogo) {
    let voando = false

    this.elemento = novoElemento('img', 'passaro')
    this.elemento.src = 'imgs/passaro.png'

    this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0])
    this.setY = y => this.elemento.style.bottom = `${y}px`

    window.onkeydown = e => voando = true // quando estiver pressionando a tecla, o passaro voa
    window.onkeyup = e => voando = false // quando não estiver pressionando a tecla, o passaro desce

    this.animar = () => {
        const novoY = this.getY() + (voando ? 8 : -5) 
        const alturaMaxima = alturaJogo - this.elemento.clientHeight

        if (novoY <= 0) {
            this.setY(0)
        } else if (novoY >= alturaMaxima) {
            this.setY(alturaMaxima)
        } else {
            this.setY(novoY)
        }
    }

    this.setY(alturaJogo / 2)

}


function Progresso() {
    // Função construtora que cria o progesso de pontos do game
    this.elemento = novoElemento('span', 'progresso')
    this.atualizarPontos = pontos => {
        this.elemento.innerHTML = pontos
    }
    this.atualizarPontos(0)
}

function estaoSobrepostos(elementoA, elementoB) {
    // Função que verifica colisões do passaro e as barreiras
    // para haver colisão, os elementos, tantos no eixo vertical quanto no horizontal, tem que se colidirem
    const a = elementoA.getBoundingClientRect() // o retangulo relacionado ao elemento A
    const b = elementoB.getBoundingClientRect() 

    const horizontal = a.left + a.width >= b.left && b.left + b.width >= a.left
    const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top

    return horizontal && vertical
}

function colidiu(passaro, barreiras) {
    // Função que de fato verifica se houve colisão
    let colidiu = false 
    barreiras.pares.forEach(parDeBarreiras => {
        if (!colidiu) {
            const superior = parDeBarreiras.superior.elemento
            const inferior = parDeBarreiras.inferior.elemento
            colidiu = estaoSobrepostos(passaro.elemento, superior) || estaoSobrepostos(passaro.elemento, inferior)
        }
    })
    return colidiu
}

function FlappyBird() {
    // Função que de fato representa o game
    let pontos = 0

    const areaDoJogo = document.querySelector('[wm-flappy]')
    const altura = areaDoJogo.clientHeight
    const largura = areaDoJogo.clientWidth

    const progresso = new Progresso()
    const barreiras = new Barreiras( altura, largura, 200, 400, () => progresso.atualizarPontos(++pontos) )
    const passaro = new Passaro(altura)

    areaDoJogo.appendChild(progresso.elemento)
    areaDoJogo.appendChild(passaro.elemento)
    barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

    this.start = () => {
        const temporizador = setInterval(() => {
            barreiras.animar()
            passaro.animar()

            if (colidiu(passaro, barreiras)) {
                clearInterval(temporizador)
            }
        }, 15) 
    }
}

new FlappyBird().start()