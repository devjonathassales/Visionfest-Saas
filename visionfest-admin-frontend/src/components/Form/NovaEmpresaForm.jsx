import React, { useState, useEffect, useRef } from "react";
import IMask from "imask";
import { X } from "lucide-react";
import api from "../../utils/api";
import ReceberForm from "./ReceberForm";

export default function NovaEmpresaModalForm({
  onClose,
  onSuccess,
  empresaParaEditar,
}) {
  const [form, setForm] = useState({
    nome: "",
    cpfCnpj: "",
    dominio: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    whatsapp: "",
    instagram: "",
    email: "",
    senhaSuperAdmin: "",
    planoId: "",
  });

  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [empresaIdCriada, setEmpresaIdCriada] = useState(null);

  const cpfCnpjRef = useRef(null);
  const maskRef = useRef(null);

  useEffect(() => {
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

  useEffect(() => {
    if (cpfCnpjRef.current) {
      maskRef.current = IMask(cpfCnpjRef.current, {
        mask: [{ mask: "000.000.000-00" }, { mask: "00.000.000/0000-00" }],
        dispatch: function (appended, dynamicMasked) {
          const number = (dynamicMasked.value + appended).replace(/\D/g, "");
          return number.length > 11
            ? dynamicMasked.compiledMasks[1]
            : dynamicMasked.compiledMasks[0];
        },
      });

      maskRef.current.on("accept", () => {
        setForm((f) => ({ ...f, cpfCnpj: maskRef.current.value }));
      });

      return () => {
        if (maskRef.current) {
          maskRef.current.destroy();
          maskRef.current = null;
        }
      };
    }
  }, []);

  // Se veio empresaParaEditar, preenche o formulário
  useEffect(() => {
    if (empresaParaEditar) {
      setForm({
        nome: empresaParaEditar.nome || "",
        cpfCnpj: empresaParaEditar.cpfCnpj || "",
        dominio: empresaParaEditar.dominio || "",
        cep: empresaParaEditar.cep || "",
        endereco: empresaParaEditar.endereco || "",
        numero: empresaParaEditar.numero || "",
        bairro: empresaParaEditar.bairro || "",
        cidade: empresaParaEditar.cidade || "",
        uf: empresaParaEditar.uf || "",
        whatsapp: empresaParaEditar.whatsapp || "",
        instagram: empresaParaEditar.instagram || "",
        email: empresaParaEditar.email || "",
        senhaSuperAdmin: "", // senha não pré-preenchida por segurança
        planoId: empresaParaEditar.planoId || "",
      });
      setEmpresaIdCriada(null);
    }
  }, [empresaParaEditar]);

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
        endereco: data.logradouro ?? "",
        bairro: data.bairro ?? "",
        cidade: data.localidade ?? "",
        uf: data.uf ?? "",
      }));
    } catch {
      alert("Erro ao buscar CEP");
    }
  }

  function onChange(e) {
    const { name, value } = e.target;
    if (name !== "cpfCnpj") {
      setForm((f) => ({ ...f, [name]: value ?? "" }));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (
      !form.nome ||
      !form.cpfCnpj ||
      !form.email ||
      !form.whatsapp ||
      !form.planoId
    ) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);

      if (empresaParaEditar) {
        // Edição: não permite editar domínio, email e senha pelo admin
        const updateData = { ...form };
        delete updateData.dominio;
        delete updateData.email;
        delete updateData.senhaSuperAdmin;

        await api.put(`/empresas/${empresaParaEditar.id}`, updateData);
        alert("Empresa atualizada com sucesso!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        // Criação
        const res = await api.post("/empresas", form);
        const novaEmpresaId = res.data?.empresa?.id || res.data?.id;
        if (!novaEmpresaId) {
          alert("Erro: ID da empresa não retornado corretamente.");
          return;
        }
        setEmpresaIdCriada(novaEmpresaId);
      }
    } catch (error) {
      alert("Erro ao salvar empresa");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center px-8 py-4 border-b bg-white sticky top-0 z-10">
        <h2 className="text-3xl font-semibold text-gray-800">
          {empresaParaEditar ? "Editar Empresa" : "Cadastrar Nova Empresa"}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800 p-2"
        >
          <X size={24} />
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome *
          </label>
          <input
            name="nome"
            value={form.nome}
            onChange={onChange}
            required
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CPF/CNPJ *
          </label>
          <input
            name="cpfCnpj"
            ref={cpfCnpjRef}
            value={form.cpfCnpj}
            onChange={() => {}}
            maxLength={18}
            required
            disabled={!!empresaParaEditar} // bloqueia edição do cpfCnpj na edição
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Domínio *
          </label>
          <input
            name="dominio"
            value={form.dominio}
            onChange={onChange}
            placeholder="Ex: minhaempresa"
            required
            disabled={!!empresaParaEditar} // bloqueia edição do domínio na edição
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP
          </label>
          <input
            name="cep"
            value={form.cep}
            onChange={onChange}
            onBlur={buscarCEP}
            maxLength={9}
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Endereço
          </label>
          <input
            name="endereco"
            value={form.endereco}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número
          </label>
          <input
            name="numero"
            value={form.numero}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bairro
          </label>
          <input
            name="bairro"
            value={form.bairro}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cidade
          </label>
          <input
            name="cidade"
            value={form.cidade}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            UF
          </label>
          <input
            name="uf"
            value={form.uf}
            onChange={onChange}
            maxLength={2}
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plano *
          </label>
          <select
            name="planoId"
            value={form.planoId}
            onChange={onChange}
            required
            disabled={!!empresaParaEditar} // não pode alterar o plano no editar
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Selecione</option>
            {planos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WhatsApp *
          </label>
          <input
            name="whatsapp"
            value={form.whatsapp}
            onChange={onChange}
            required
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram
          </label>
          <input
            name="instagram"
            value={form.instagram}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            disabled={!!empresaParaEditar} // não pode editar o email no editar
            className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {!empresaParaEditar && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha SuperAdmin *
            </label>
            <input
              name="senhaSuperAdmin"
              type="password"
              value={form.senhaSuperAdmin}
              onChange={onChange}
              placeholder="Senha do administrador"
              required
              className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        )}

        <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-md border border-gray-300 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-7 py-3 rounded-md hover:bg-green-700 disabled:opacity-60"
          >
            {loading
              ? "Salvando..."
              : empresaParaEditar
              ? "Atualizar"
              : "Salvar"}
          </button>
        </div>
      </form>

      {/* Se criou empresa nova, mostra formulário ReceberForm para pagamento */}
      {!empresaParaEditar && empresaIdCriada && (
        <div className="p-8 border-t mt-8">
          <h3 className="text-xl font-semibold mb-4">
            Pagamento / Recebimento
          </h3>
          <ReceberForm
            empresa={{
              id: empresaIdCriada,
              nome: form.nome,
              dominio: form.dominio,
            }}
            onSuccess={async () => {
              try {
                await api.post(`/empresas/${empresaIdCriada}/ativar`);
                alert("Pagamento registrado e empresa ativada com sucesso!");
                onClose();
              } catch (err) {
                alert(
                  "Pagamento foi registrado, mas houve erro ao ativar a empresa"
                );
                console.error(err);
              }
            }}
            onClose={onClose}
          />
        </div>
      )}
    </div>
  );
}
