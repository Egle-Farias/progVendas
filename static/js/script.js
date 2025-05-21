document.addEventListener('DOMContentLoaded', () => {
  // Função para carregar produtos
  async function carregarProdutos() {
    try {
      const res = await fetch('/produtos');
      const produtos = await res.json();
      const tabela = document.getElementById('tabela-produtos');
      tabela.innerHTML = '';
      produtos.forEach(produto => {
        tabela.innerHTML += `
          <tr>
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>R$ ${produto.preco.toFixed(2)}</td>
            <td>${produto.quantidade}</td>
          </tr>
        `;
      });
    } catch (err) {
      alert('❌ Erro ao carregar produtos.');
    }
  }

  // Adicionar produto
  document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const preco = parseFloat(document.getElementById('preco').value);
    const quantidade = parseInt(document.getElementById('quantidade').value);

    try {
      const res = await fetch('/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, preco, quantidade })
      });
      const data = await res.json();
      if (res.ok) {
        carregarProdutos();
        alert(data.mensagem);
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
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

    try {
      const res = await fetch('/vender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: produtoId, quantidade_vendida: quantidadeVendida })
      });
      const data = await res.json();
      if (res.ok) {
        carregarProdutos();
        alert(data.mensagem);
        bootstrap.Modal.getInstance(document.getElementById('sellProductModal')).hide();
      } else {
        alert('Erro: ' + data.mensagem);
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor.');
    }
  });

  // Alterar produto
  document.getElementById('alter-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const produtoId = document.getElementById('alter-produto-id').value;
    const nome = document.getElementById('alter-nome').value;
    const preco = parseFloat(document.getElementById('alter-preco').value);
    const quantidade = parseInt(document.getElementById('alter-quantidade').value);

    try {
      const res = await fetch(`/produto/${produtoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, preco, quantidade })
      });
      const data = await res.json();
      if (res.ok) {
        carregarProdutos();
        alert(data.mensagem);
        bootstrap.Modal.getInstance(document.getElementById('alterProductModal')).hide();
      } else {
        alert('Erro: ' + data.mensagem);
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor.');
    }
  });

  // Substituir produto (apenas o nome)
  document.getElementById('substitute-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const produtoId = document.getElementById('substitute-produto-id').value;
    const novoNome = document.getElementById('substitute-nome').value;

    try {
      const res = await fetch(`/substituir/${produtoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome })
      });
      const data = await res.json();
      if (res.ok) {
        carregarProdutos();
        alert(data.mensagem);
        bootstrap.Modal.getInstance(document.getElementById('substituteProductModal')).hide();
      } else {
        alert('Erro: ' + data.mensagem);
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor.');
    }
  });

  // Excluir produto
  document.getElementById("delete-product-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const id = parseInt(document.getElementById("delete-produto-id").value);

    fetch(`/excluir/${id}`, {
      method: "DELETE"
    })
      .then(response => {
        if (response.ok) {
          alert("Produto excluído com sucesso.");
          carregarProdutos();
        } else {
          alert("Erro ao excluir o produto.");
        }
      });
  });

  // Gerar relatório de vendas
  document.getElementById('generate-report').addEventListener('click', async () => {
    try {
      const res = await fetch('/relatorio-vendas');
      const report = await res.json();
      const reportList = document.getElementById('report-list');
      reportList.innerHTML = '';

      report.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = `Produto: ${item.nome}, Quantidade: ${item.quantidade}, Total: R$ ${item.total.toFixed(2)}`;
        reportList.appendChild(listItem);
      });
    } catch (error) {
      alert('Erro ao gerar relatório de vendas.');
    }
  });

  // Gerar balancete financeiro
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

  // Baixar balancete em PDF
  document.getElementById('download-financial-report').addEventListener('click', () => {
    const dataInicio = document.getElementById("start-date").value;
    const dataFim = document.getElementById("end-date").value;

    let url = "/balancete-pdf";
    if (dataInicio && dataFim) {
      url += `?data_inicio=${dataInicio}&data_fim=${dataFim}`;
    }

    window.location.href = url;
  });

  // Salvar ordem de serviço
  document.getElementById('formOrdemServico').addEventListener('submit', async function (e) {
    e.preventDefault();
    const ordemServico = {
      dataEntrada: document.getElementById('dataEntrada').value,
      horaEntrada: document.getElementById('horaEntrada').value,
      cpfCliente: document.getElementById('cpfCliente').value,
      nomeCliente: document.getElementById('nomeCliente').value,
      contatoCliente: document.getElementById('contatoCliente').value,
      descricaoProduto: document.getElementById('descricaoProduto').value,
      descricaoProblema: document.getElementById('descricaoProblema').value,
      prazoEntrega: document.getElementById('prazoEntrega').value
    };

    try {
      const response = await fetch('/ordem-servico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ordemServico)
      });

      if (response.ok) {
        alert('Ordem de Serviço salva com sucesso!');
        // Fechar modal ou limpar formulário, se necessário
      } else {
        const errorData = await response.json();
        alert('Erro ao salvar Ordem de Serviço: ' + errorData.mensagem);
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor.');
    }
  });

  // Imprimir ordem de serviço
  document.getElementById('print-ordem-servico').addEventListener('click', () => {
    const printContents = document.getElementById('ordemServicoContent').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Ordem de Serviço</title>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContents);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  });

  // Carregar produtos ao iniciar
  carregarProdutos();
});
