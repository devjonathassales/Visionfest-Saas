import React, { useState, useEffect } from "react";
import IMask from "imask";
import { X } from "lucide-react";
import api from "../../utils/api";

export default function NovaEmpresaModalForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    nome: "",
    cpfCnpj: "",
    cep: "",
    endereco: "",
    bairro: "",
    cidade: "",
    uf: "",
    whatsapp: "",
    instagram: "",
    email: "",
    senhaSuperAdmin: "",
    logo: null,
    planoId: "", // mudou para planoId (numérico)
    usuarioSuperAdmin: "",
  });
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Buscar planos do backend para popular select
    async function fetchPlanos() {
      try {
        const res = await api.get("/planos");
        setPlanos(res.data);
      } catch {
        alert("Erro ao carregar planos");
      }
    }
    fetchPlanos();
  }, []);

  function aplicarMascaraCPF_CNPJ(e) {
    const el = e.target;
    const onlyNumbers = el.value.replace(/\D/g, "");
    const mask = onlyNumbers.length > 11 ? "00.000.000/0000-00" : "000.000.000-00";

    const masked = IMask.createMask({ mask });
    const value = masked.resolve(el.value);
    setForm((f) => ({ ...f, cpfCnpj: value }));
  }

  async function buscarCEP() {
    if (!form.cep) return;

    try {
      const res = await fetch(
        `https://viacep.com.br/ws/${form.cep.replace(/\D/g, "")}/json/`
      );
      const data = await res.json();
      if (data.erro) {
        alert("CEP não encontrado");
        return;
      }
      setForm((f) => ({
        ...f,
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
      }));
    } catch {
      alert("Erro ao buscar CEP");
    }
  }

  function onChange(e) {
    const { name, value, files } = e.target;
    if (name === "logo") {
      setForm((f) => ({ ...f, logo: files[0] }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!form.nome || !form.cpfCnpj || !form.email || !form.whatsapp || !form.planoId) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          formData.append(key, val);
        }
      });

      await api.post("/empresas", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Empresa criada com sucesso!");
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      alert("Erro ao criar empresa");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-screen overflow-y-auto">
      {/* Header fixo */}
      <div className="flex justify-between items-center px-6 py-4 border-b sticky top-0 bg-white z-10">
        <h2 className="text-xl font-semibold text-gray-800">Nova Empresa</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 p-2"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Corpo do Modal */}
      <form
        onSubmit={onSubmit}
        className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {/* Nome */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input
            name="nome"
            value={form.nome}
            onChange={onChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
          />
        </div>

        {/* CPF/CNPJ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ *</label>
          <input
            name="cpfCnpj"
            value={form.cpfCnpj}
            onChange={aplicarMascaraCPF_CNPJ}
            maxLength={18}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
          />
        </div>

        {/* CEP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
          <input
            name="cep"
            value={form.cep}
            onChange={onChange}
            onBlur={buscarCEP}
            maxLength={9}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        </div>

        {/* Plano */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plano *</label>
          <select
            name="planoId"
            value={form.planoId}
            onChange={onChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
          >
            <option value="">Selecione o plano</option>
            {planos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Endereço */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <input
            name="endereco"
            value={form.endereco}
            onChange={onChange}
            className="w-full border border-gray-200 px-3 py-2 rounded-md bg-gray-100"
            readOnly
          />
        </div>

        {/* Bairro */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
          <input
            name="bairro"
            value={form.bairro}
            onChange={onChange}
            className="w-full border border-gray-200 px-3 py-2 rounded-md bg-gray-100"
            readOnly
          />
        </div>

        {/* Cidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
          <input
            name="cidade"
            value={form.cidade}
            onChange={onChange}
            className="w-full border border-gray-200 px-3 py-2 rounded-md bg-gray-100"
            readOnly
          />
        </div>

        {/* UF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
          <input
            name="uf"
            value={form.uf}
            onChange={onChange}
            className="w-full border border-gray-200 px-3 py-2 rounded-md bg-gray-100"
            readOnly
          />
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
          <input
            name="whatsapp"
            value={form.whatsapp}
            onChange={onChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
          />
        </div>

        {/* Instagram */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
          <input
            name="instagram"
            value={form.instagram}
            onChange={onChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
          />
        </div>

        {/* Email */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
          />
        </div>

        {/* Usuário e Senha SuperAdmin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Usuário SuperAdmin *</label>
          <input
            name="usuarioSuperAdmin"
            value={form.usuarioSuperAdmin}
            onChange={onChange}
            placeholder="E-mail do SuperAdmin"
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha SuperAdmin *</label>
          <input
            name="senhaSuperAdmin"
            type="password"
            value={form.senhaSuperAdmin}
            onChange={onChange}
            placeholder="Senha do SuperAdmin"
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
            required
          />
        </div>

        {/* Botões */}
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-5 py-2 rounded-md hover:bg-green-700"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
