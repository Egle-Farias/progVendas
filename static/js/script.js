
// Função para carregar os produtos do servidor
async function loadProducts() {
    const response = await fetch('/produtos');
    const products = await response.json();
    const productList = document.getElementById('produtos-list');
    productList.innerHTML = '';

    products.forEach(product => {
        const listItem = document.createElement('li');
        listItem.textContent = `${product.nome} - R$ ${product.preco.toFixed(2)} - Estoque: ${product.quantidade}`;
        productList.appendChild(listItem);
    });
}

// Adicionar produto
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const nome = document.getElementById('nome').value;
        const preco = parseFloat(document.getElementById('preco').value);
        const quantidade = parseInt(document.getElementById('quantidade').value);

        const response = await fetch('/produtos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, preco, quantidade })
        });

        const data = await response.json();
        if (response.ok) {
            loadProducts();
            alert(data.mensagem);
        } else {
            alert('Erro: ' + data.mensagem);
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor.');
    }
});

// Vender produto
document.getElementById('sell-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const produtoId = document.getElementById('produto-id').value;
    const quantidadeVendida = document.getElementById('quantidade-vendida').value;

    const response = await fetch('/vender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: produtoId, quantidade_vendida: quantidadeVendida })
    });

    const data = await response.json();
    if (response.ok) {
        loadProducts();
        alert(data.mensagem);
    } else {
        alert('Erro: ' + data.mensagem);
    }
});

// Alterar produto
document.getElementById('alter-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const produtoId = document.getElementById('alter-produto-id').value;
    const nome = document.getElementById('alter-nome').value;
    const preco = parseFloat(document.getElementById('alter-preco').value);
    const quantidade = parseInt(document.getElementById('alter-quantidade').value);

    const response = await fetch(`/produto/${produtoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, preco, quantidade })
    });

    const data = await response.json();
    if (response.ok) {
        loadProducts();
        alert(data.mensagem);
    } else {
        alert('Erro: ' + data.mensagem);
    }
});

// Substituir produto (só o nome)
document.getElementById('substitute-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const produtoId = document.getElementById('substitute-produto-id').value;
    const novoNome = document.getElementById('substitute-nome').value;

    const response = await fetch(`/substituir/${produtoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome })
    });

    const data = await response.json();
    if (response.ok) {
        loadProducts();
        alert(data.mensagem);
    } else {
        alert('Erro: ' + data.mensagem);
    }
});

// Gerar relatório de vendas
document.getElementById('generate-report').addEventListener('click', async () => {
    const response = await fetch('/relatorio-vendas');
    const report = await response.json();
    const reportList = document.getElementById('report-list');
    reportList.innerHTML = '';

    report.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = `Produto: ${item.nome}, Quantidade: ${item.quantidade}, Total: R$ ${item.total.toFixed(2)}`;
        reportList.appendChild(listItem);
    });
});

// Gerar balancete financeiro
document.getElementById('generate-financial-report').addEventListener('click', async () => {
    console.log("Botão clicado!"); // <-- Adicione isso para testar
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    let url = '/balancete';
if (startDate && endDate) {
    url += `?data_inicio=${encodeURIComponent(startDate)}&data_fim=${encodeURIComponent(endDate)}`;
    console.log("URL gerada para balancete:", url);  // 👈 Adicionado para debug
} else {
    console.log("Datas não preenchidas corretamente:", startDate, endDate);
}

    const response = await fetch(url);
    const report = await response.json();

    document.getElementById('financial-report').innerHTML = `
        <p>Total de Vendas: R$ ${report.total_vendas}</p>
        <p>Total de Itens Vendidos: ${report.total_itens_vendidos}</p>
        <p>Número de Vendas Realizadas: ${report.num_vendas}</p>
    `;
    function baixarBalancete() {
        // Redireciona o navegador para a rota que gera o PDF
        window.location.href = "/balancete-pdf";
    }

});

// Baixar relatório em PDF
document.getElementById('download-pdf').addEventListener('click', () => {
    window.location.href = '/relatorio-pdf';
});

// Carregar os produtos ao abrir a página
window.addEventListener('DOMContentLoaded', loadProducts);

function baixarBalancete() {
    const dataInicio = document.getElementById("start-date").value;
    const dataFim = document.getElementById("end-date").value;

    let url = "/balancete-pdf";
    if (dataInicio && dataFim) {
        url += `?data_inicio=${dataInicio}&data_fim=${dataFim}`;
    }

    window.location.href = url;
}

document.getElementById('generate-financial-report').addEventListener('click', () => {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    fetch(`/balancete?data_inicio=${startDate}&data_fim=${endDate}`)
        .then(response => response.json())
        .then(data => {
            const reportDiv = document.getElementById('financial-report');
            reportDiv.innerHTML = `
                <h3>Resumo do Balancete</h3>
                <p>Total de Vendas: R$ ${data.total_vendas.toFixed(2)}</p>
                <p>Total de Itens Vendidos: ${data.total_itens}</p>
                <p>Número de Vendas Realizadas: ${data.num_vendas}</p>
            `;
        })
        .catch(error => {
            console.error('Erro ao gerar balancete:', error);
            alert('Erro ao gerar balancete!');
        });
});


