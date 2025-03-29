from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask import render_template
from sqlalchemy import Integer



app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///progvendas.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelo de Produto
class Produto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    preco = db.Column(db.Float, nullable=False)
    quantidade = db.Column(db.Integer, nullable=False)

class Venda(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    produto_id = db.Column(db.Integer, db.ForeignKey('produto.id'), nullable=False)
    quantidade = db.Column(db.Integer, nullable=False)
    preco_unitario = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    produto = db.relationship('Produto', backref=db.backref('vendas', lazy=True))


# Criar banco de dados
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
    return jsonify([{ "id": p.id, "nome": p.nome, "preco": p.preco, "quantidade": p.quantidade } for p in produtos])

# Vender produto
@app.route('/vender', methods=['POST'])
def vender_produto():
    dados = request.get_json()  # Obtém os dados enviados pelo frontend
    
    produto_id = dados.get('produto_id')
    quantidade_vendida = dados.get('quantidade_vendida')  # Pega o valor da quantidade vendida
    
    print(f"Produto ID: {produto_id}, Quantidade Vendida: {quantidade_vendida}")  # Adiciona o log
    
    # Verifica se a quantidade vendida foi fornecida e se é um número válido
    if quantidade_vendida is None:
        return jsonify({"message": "A quantidade vendida não foi fornecida."}), 400
    
    try:
        quantidade_vendida = int(quantidade_vendida)  # Converte para inteiro
    except ValueError:
        return jsonify({"message": "A quantidade vendida deve ser um número válido."}), 400
    
    # Verifica se o produto existe
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({"message": "Produto não encontrado."}), 400
    
    print(f"Produto encontrado: {produto.nome}, Quantidade em estoque: {produto.quantidade}")  # Log de produto encontrado
    
    # Verifica se a quantidade do produto é válida (não None)
    if produto.quantidade is None:
        return jsonify({"message": "Quantidade do produto não encontrada."}), 400
    
    # Verifica se a quantidade disponível é suficiente
    if produto.quantidade >= quantidade_vendida:
        produto.quantidade -= quantidade_vendida
        db.session.commit()
        return jsonify({"message": "Venda realizada com sucesso!"}), 200
    else:
        return jsonify({"message": "Quantidade insuficiente ou produto não encontrado."}), 400

# Alterar produto
@app.route('/produto/<int:produto_id>', methods=['PUT'])
def alterar_produto(produto_id):
    dados = request.get_json()
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({"message": "Produto não encontrado."}), 404
    
    produto.nome = dados.get('nome', produto.nome)
    produto.preco = dados.get('preco', produto.preco)
    produto.quantidade = dados.get('quantidade', produto.quantidade)
    db.session.commit()
    return jsonify({"message": "Produto atualizado com sucesso!"}), 200

# Substituir produto
@app.route('/substituir/<int:produto_id>', methods=['PUT'])
def substituir_produto(produto_id):
    dados = request.get_json()
    produto = Produto.query.get(produto_id)
    if not produto:
        return jsonify({"message": "Produto não encontrado."}), 404

    # Exemplo: vamos permitir a substituição apenas do nome
    novo_nome = dados.get('nome')
    if not novo_nome:
        return jsonify({"message": "Novo nome não fornecido."}), 400

    produto.nome = novo_nome
    db.session.commit()
    return jsonify({"message": "Produto substituído com sucesso!"}), 200

# Gerar relatório de estoque
@app.route('/relatorio-vendas', methods=['GET'])
def relatorio_vendas():
    vendas = Venda.query.all()
    return jsonify([{
        'nome': venda.produto.nome,
        'quantidade': venda.quantidade,
        'total': venda.total
    } for venda in vendas])

@app.route('/balancete', methods=['GET'])
def balancete():
    vendas = Venda.query.all()
    total_vendas = sum(venda.total for venda in vendas)
    total_itens_vendidos = sum(venda.quantidade for venda in vendas)
    return jsonify({
        'total_vendas': total_vendas,
        'total_itens_vendidos': total_itens_vendidos,
        'num_vendas': len(vendas)
    })


if __name__ == '__main__':
    app.run(debug=True)
