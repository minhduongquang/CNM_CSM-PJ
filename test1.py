import hashlib
import datetime
import json
from urllib.parse import urlparse
import requests

# Định nghĩa khối (block) trong blockchain
class Khoi:
    def __init__(self, so_thu_tu, thoi_gian, du_lieu, ma_khoi_truoc, khoi_moi_proof):
        self.so_thu_tu = so_thu_tu
        self.thoi_gian = thoi_gian
        self.du_lieu = du_lieu
        self.ma_khoi_truoc = ma_khoi_truoc
        self.khoi_moi_proof = khoi_moi_proof
        self.ma_khoi = self.tao_ma_khoi()

    def tao_ma_khoi(self):
        chuoi_ma_khoi = str(self.so_thu_tu) + str(self.thoi_gian) + str(self.du_lieu) + str(self.ma_khoi_truoc) + str(self.khoi_moi_proof)
        ma_khoi = hashlib.sha256(chuoi_ma_khoi.encode()).hexdigest()
        return ma_khoi

# Định nghĩa blockchain
class Blockchain:
    def __init__(self):
        self.chain = []
        self.danh_sach_giao_dich = []
        self.peer_nodes = set()
        self.them_genesis_khoi()

    def them_genesis_khoi(self):
        thoi_gian = datetime.datetime.now()
        khoi_genesis = Khoi(0, thoi_gian, "Genesis Block", "0", 0)
        self.chain.append(khoi_genesis)

    def them_khoi_moi(self, proof):
        so_thu_tu = len(self.chain)
        thoi_gian = datetime.datetime.now()
        ma_khoi_truoc = self.chain[-1].ma_khoi
        khoi_moi = Khoi(so_thu_tu, thoi_gian, self.danh_sach_giao_dich, ma_khoi_truoc, proof)
        self.chain.append(khoi_moi)
        self.danh_sach_giao_dich = []

    def them_giao_dich_moi(self, nguoi_gui, nguoi_nhan, so_tien):
        self.danh_sach_giao_dich.append({
            'nguoi_gui': nguoi_gui,
            'nguoi_nhan': nguoi_nhan,
            'so_tien': so_tien
        })
        return self.chain[-1].so_thu_tu + 1

    def tim_proof_moi(self, ma_khoi_truoc):
        proof = 0
        while self.kiem_tra_proof(ma_khoi_truoc, proof) is False:
            proof += 1
        return proof

    def kiem_tra_proof(self, ma_khoi_truoc, proof):
        chuoi_kiem_tra = str(ma_khoi_truoc) + str(proof)
        hash_kiem_tra = hashlib.sha256(chuoi_kiem_tra.encode()).hexdigest()
        return hash_kiem_tra[:4] == "0000"

    def kiem_tra_chain_hop_le(self, chain):
        khoi_truoc = chain[0]
        i = 1
        while i < len(chain):
            khoi_moi = chain[i]
            if khoi_moi.ma_khoi_truoc != khoi_truoc.ma_khoi or not self.kiem_tra_proof(khoi_truoc.ma_khoi, khoi_moi.khoi_moi_proof):
                return False
            khoi_truoc = khoi_moi
            i += 1
        return True

    def them_peer_node(self, dia_chi):
        parsed_url = urlparse(dia_chi)
        self.peer_nodes.add(parsed_url.netloc)

    def dong_bo_blockchain(self):
        network = self.peer_nodes
        longest_chain = None
        max_length = len(self.chain)

        for node in network:
            response = requests.get(f'http://{node}/chain')
            if response.status_code == 200:
                length = response.json()['length']
                chain = response.json()['chain']
                if length > max_length and self.kiem_tra_chain_hop_le(chain):
                    max_length = length
                    longest_chain = chain

        if longest_chain:
            self.chain = longest_chain
            return True

        return False

    def in_blockchain(self):
        for khoi in self.chain:
            print("Số thứ tự:", khoi.so_thu_tu)
            print("Thời gian:", khoi.thoi_gian)
            print("Dữ liệu:", khoi.du_lieu)
            print("Mã khối trước:", khoi.ma_khoi_truoc)
            print("Mã khối:", khoi.ma_khoi)
            print("Proof:", khoi.khoi_moi_proof)
            print("--------------------")

# Tạo một blockchain mới
blockchain = Blockchain()

# Thêm các giao dịch vào blockchain
blockchain.them_giao_dich_moi("Alice", "Bob", 10)
blockchain.them_giao_dich_moi("Bob", "Charlie", 5)

# Tìm proof mới và thêm khối mới vào blockchain
ma_khoi_truoc = blockchain.chain[-1].ma_khoi
proof_moi = blockchain.tim_proof_moi(ma_khoi_truoc)
blockchain.them_khoi_moi(proof_moi)

# In thông tin về các khối trong blockchain
blockchain.in_blockchain()

