#!/usr/bin/env node

/* bootstrap database in your FaunaDB account - use with `netlify dev:exec <path-to-this-file>` */
const faunadb = require('faunadb')

const q = faunadb.query

function createServerList() {
  if (!process.env.FAUNADB_SERVER_SECRET) {
    console.log('No FAUNADB_SERVER_SECRET in environment, skipping DB setup')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
  })

  /* Based on your requirements, change the schema here */
  return client.query(
    q.CreateCollection({ name: 'serverlist' })
  ).then(() => {
    return client.query(
      q.CreateIndex({
        unique: false,
        name: 'serverlist_by_ip_and_port',
        source: q.Collection('serverlist'),
        terms: [
          { field: ['data', 'ip'] },
          { field: ['data', 'port'] }
        ],
      }),
    )
  }).then(() => {
    return client.query(
      q.CreateIndex({
        unique: true,
        name: 'unique_serverlist_by_ip_and_port_and_name',
        source: q.Collection('serverlist'),
        terms: [
          { field: ['data', 'ip'] },
          { field: ['data', 'port'] },
          { field: ['data', 'name'] }
        ],
      }),
    )
  })
  .catch(e => {
    if (e.requestResult.statusCode === 400 && e.message === 'instance not unique') {
      console.log('DB already exists')
    }
    throw e
  })
}

function createBannedServers() {
  if (!process.env.FAUNADB_SERVER_SECRET) {
    console.log('No FAUNADB_SERVER_SECRET in environment, skipping DB setup')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
  })

  /* Based on your requirements, change the schema here */
  return client.query(
    q.CreateCollection({ name: 'banned_servers' })
  ).then(() => {
    return client.query(
      q.CreateIndex({
        unique: false,
        name: 'banned_servers_by_ip',
        source: q.Collection('banned_servers'),
        terms: [
          { field: ['data', 'ip'] }
        ],
      }),
    )
  })
  .catch(e => {
    if (e.requestResult.statusCode === 400 && e.message === 'instance not unique') {
      console.log('DB already exists')
    }
    throw e
  })
}

createServerList()
createBannedServers()
