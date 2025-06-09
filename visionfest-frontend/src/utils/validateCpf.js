export function isValidCpf(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let check1 = 11 - (sum % 11);
  if (check1 > 9) check1 = 0;
  if (check1 !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  let check2 = 11 - (sum % 11);
  if (check2 > 9) check2 = 0;
  return check2 === parseInt(cpf.charAt(10));
}
