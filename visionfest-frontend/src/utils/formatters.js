export function formatarMoeda(valor) {
  if (!valor) return '';
  return valor
    .replace(/\D/g, '')
    .replace(/^0+/, '')
    .padStart(3, '0')
    .replace(/(\d)(\d{2})$/, '$1,$2')
    .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}
