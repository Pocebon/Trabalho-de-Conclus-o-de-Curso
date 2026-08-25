import pgPromise from 'pg-promise'

const pgp = pgPromise()

const db = pgp({
  host: 'localhost',
  port: 5432,
  database: 'tcc2',
  user: 'postgres',
  password: '28102004Lipe#'
})

export default db