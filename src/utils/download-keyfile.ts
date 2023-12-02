export const downloadKeyfile = (uqName: string, keyfileText: string) => {
  let blob = new Blob([keyfileText], {type: "text/plain;charset=utf-8"});
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${uqName}.keyfile`)
  document.body.appendChild(link);
  link.click();
}
