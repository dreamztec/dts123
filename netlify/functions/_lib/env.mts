export const Netlify = {
  env: {
    get: (key:string) => process.env[key],
  },
}