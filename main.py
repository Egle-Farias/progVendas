from flask import Flask, request, jsonify, render_template, Response
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///banco.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Definição dos modelos do banco
class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    preco = db.Column(db.Float, nullable=False)
    quantidade = db.Column(db.Integer, nullable=False)

class Venda(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    produto_id = db.Column(db.Integer, db.ForeignKey('produto.id'), nullable=False)
    produto = db.relationship('Produto', backref=db.backref('vendas', lazy=True))
    quantidade = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Float, nullable=False)
    data = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

# Adicionar produto
@app.route('/produtos', methods=['POST'])
def adicionar_produto():
    dados = request.json
    novo_produto = Produto(nome=dados['nome'], preco=dados['preco'], quantidade=dados['quantidade'])
    db.session.add(novo_produto)
    db.session.commit()
    return jsonify({"mensagem": "Produto adicionado com sucesso!"})

# Listar produtos
@app.route('/produtos', methods=['GET'])
def listar_produtos():
    produtos = Produto.query.all()
    return jsonify([{"id": p.id, "nome": p.nome, "preco": p.preco, "quantidade": p.quantidade} for p in produtos])

# Vender produto
@app.route('/vender', methods=['POST'])
def vender_produto():
    dados = request.get_json()
    produto_id = dados.get('produto_id')
    quantidade_vendida = dados.get('quantidade_vendida')

    if quantidade_vendida is None:
        return jsonify({"mensagem": "A quantidade vendida não foi fornecida."}), 400

    try:
        quantidade_vendida = int(quantidade_vendida)
    except ValueError:
        return jsonify({"mensagem": "A quantidade vendida deve ser um número válido."}), 400

    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({"mensagem": "Produto não encontrado."}), 400

    if produto.quantidade >= quantidade_vendida:
        produto.quantidade -= quantidade_vendida
        total_venda = quantidade_vendida * produto.preco
        nova_venda = Venda(produto_id=produto.id, quantidade=quantidade_vendida, total=total_venda)
        db.session.add(nova_venda)
        db.session.commit()
        return jsonify({"mensagem": "Venda realizada com sucesso!"}), 200
    else:
        return jsonify({"mensagem": "Quantidade insuficiente ou produto não encontrado."}), 400

# Alterar produto
@app.route('/produto/<int:produto_id>', methods=['PUT'])
def alterar_produto(produto_id):
    dados = request.get_json()
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({"mensagem": "Produto não encontrado."}), 404

    produto.nome = dados.get('nome', produto.nome)
    produto.preco = dados.get('preco', produto.preco)
    produto.quantidade = dados.get('quantidade', produto.quantidade)
    db.session.commit()
    return jsonify({"mensagem": "Produto atualizado com sucesso!"}), 200

# Substituir produto
@app.route('/substituir/<int:produto_id>', methods=['PUT'])
def substituir_produto(produto_id):
    dados = request.get_json()
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({"mensagem": "Produto não encontrado."}), 404

    novo_nome = dados.get('nome')
    if not novo_nome:
        return jsonify({"mensagem": "Novo nome não fornecido."}), 400

    produto.nome = novo_nome
    db.session.commit()
    return jsonify({"mensagem": "Produto substituído com sucesso!"}), 200

# Gerar relatório de vendas
@app.route('/relatorio-vendas', methods=['GET'])
def relatorio_vendas():
    vendas = Venda.query.all()
    return jsonify([{
        'nome': venda.produto.nome,
        'quantidade': venda.quantidade,
        'total': venda.total
    } for venda in vendas])

# Gerar balancete
@app.route('/balancete', methods=['GET'])
def balancete():
    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')

    if data_inicio and data_fim:
        data_inicio = datetime.strptime(data_inicio, '%Y-%m-%d')
        data_fim = datetime.strptime(data_fim, '%Y-%m-%d')
        vendas = Venda.query.filter(Venda.data.between(data_inicio, data_fim)).all()
    else:
        vendas = Venda.query.all()

    total_vendas = sum(venda.total for venda in vendas)
    total_itens_vendidos = sum(venda.quantidade for venda in vendas)

    return jsonify({
        'total_vendas': total_vendas,
        'total_itens_vendidos': total_itens_vendidos,
        'num_vendas': len(vendas)
    })


# Gerar relatório PDF
@app.route('/relatorio-pdf', methods=['GET'])
def relatorio_pdf():
    vendas = Venda.query.all()
    total_vendas = sum(venda.total for venda in vendas)
    total_itens_vendidos = sum(venda.quantidade for venda in vendas)

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setFont("Helvetica", 14)

    pdf.drawString(100, 750, "Relatório Financeiro - ProgVendas")
    pdf.drawString(100, 720, f"Total de Vendas: R$ {total_vendas}")
    pdf.drawString(100, 700, f"Total de Itens Vendidos: {total_itens_vendidos}")
    pdf.drawString(100, 680, f"Número de Vendas: {len(vendas)}")

    pdf.save()
    buffer.seek(0)

    return Response(buffer, mimetype='application/pdf', headers={"Content-Disposition": "attachment;filename=relatorio.pdf"})

if __name__ == '__main__':
    app.run(debug=True)
