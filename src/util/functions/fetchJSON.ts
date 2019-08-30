export default function(url: string) {
  return new Promise<any>((resolve, reject) => {
    fetch(url)
      .then(value => {
        if (!value.ok) reject(value);

        value
          .json()
          .then(resolve)
          .catch(reject);
      })
      .catch(reject);
  });
}
