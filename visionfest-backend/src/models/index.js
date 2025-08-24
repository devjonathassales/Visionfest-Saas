const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");

module.exports = async (sequelize, schema) => {
  if (!schema || typeof schema !== 'string' || !schema.trim()) {
    throw new Error("Schema inválido ou não informado");
  }

  console.log("Schema carregado:", schema);

  const db = { sequelize, Sequelize };

  // Cria o schema se não existir
  await sequelize.createSchema(schema, { ifNotExists: true });

  // Ajusta o define para usar o schema informado
  sequelize.define = ((originalDefine) => {
    return function(modelName, attributes, options = {}) {
      options.schema = schema;
      return originalDefine.call(this, modelName, attributes, options);
    };
  })(sequelize.define);

  // Carrega os models
  const files = fs.readdirSync(__dirname).filter(
    (file) => file !== "index.js" && file.endsWith(".js")
  );

  for (const file of files) {
    const modelDef = require(path.join(__dirname, file));
    if (typeof modelDef === "function") {
      const model = modelDef(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    } else if (typeof modelDef === "object") {
      Object.keys(modelDef).forEach((key) => {
        db[key] = modelDef[key];
      });
    }
  }

  // Executa associate se existir
  Object.values(db).forEach((model) => {
    if (model && typeof model.associate === "function") {
      model.associate(db);
    }
  });

  return db;
};
