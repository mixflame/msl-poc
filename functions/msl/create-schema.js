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
    // throw e
  })
}

function createBannedUsers() {
  if (!process.env.FAUNADB_SERVER_SECRET) {
    console.log('No FAUNADB_SERVER_SECRET in environment, skipping DB setup')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
  })

  /* Based on your requirements, change the schema here */
  return client.query(
    q.CreateCollection({ name: 'banned_users' })
  ).then(() => {
    return client.query(
      q.CreateIndex({
        unique: false,
        name: 'banned_users_by_ip',
        source: q.Collection('banned_users'),
        terms: [
          { field: ['data', 'ip'] }
        ],
      }),
    )
  }).then(() => {
    return client.query(
      q.CreateIndex({
        unique: false,
        name: 'banned_users_by_uuid',
        source: q.Collection('banned_users'),
        terms: [
          { field: ['data', 'uuid'] }
        ],
      }),
    )
  })
  .catch(e => {
    if (e.requestResult.statusCode === 400 && e.message === 'instance not unique') {
      console.log('DB already exists')
    }
    // throw e
  })
}

function createFilters() {
  if (!process.env.FAUNADB_SERVER_SECRET) {
    console.log('No FAUNADB_SERVER_SECRET in environment, skipping DB setup')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
  })

  /* Based on your requirements, change the schema here */
  return client.query(
    q.CreateCollection({ name: 'filters' })
  ).catch(e => {
    if (e.requestResult.statusCode === 400 && e.message === 'instance not unique') {
      console.log('DB already exists')
    }
    // throw e
  })
}

function createContentReports() {
  if (!process.env.FAUNADB_SERVER_SECRET) {
    console.log('No FAUNADB_SERVER_SECRET in environment, skipping DB setup')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
  })

  /* Based on your requirements, change the schema here */
  return client.query(
    q.CreateCollection({ name: 'content_reports' })
  ).then(() => {
    return client.query(
      q.CreateIndex({
        unique: false,
        name: 'content_reports_by_ip',
        source: q.Collection('content_reports'),
        terms: [
          { field: ['data', 'ip'] }
        ],
      }),
    )
  }).then(() => {
    return client.query(
      q.CreateIndex({
        unique: false,
        name: 'content_reports_by_handle',
        source: q.Collection('content_reports'),
        terms: [
          { field: ['data', 'handle'] }
        ],
      }),
    )
  }).then(() => {
    return client.query(
      q.CreateIndex({
        unique: false,
        name: 'content_reports_by_text',
        source: q.Collection('content_reports'),
        terms: [
          { field: ['data', 'text'] }
        ],
      }),
    )
  }).then(() => {
    return client.query(
      q.CreateIndex({
        unique: false,
        name: 'content_reports_by_date',
        source: q.Collection('content_reports'),
        terms: [
          { field: ['data', 'date'] }
        ],
      }),
    )
  })
  .catch(e => {
    if (e.requestResult.statusCode === 400 && e.message === 'instance not unique') {
      console.log('DB already exists')
    }
    // throw e
  })
}

createContentReports()
createServerList()
createBannedUsers()
createFilters()
