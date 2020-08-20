const faunadb = require('faunadb')
var net = require('net');
const { checkServerIdentity } = require('tls');
const { errorMonitor } = require('stream');

/* configure faunaDB Client with our secret */
const q = faunadb.query
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
})

// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method

exports.handler = async (event, context) => {
  let sp = event.path.split('/');
  let command = sp[sp.length-1];
  console.log(command);
  switch (command){
    // case 'banned_users': return retrieveBannedUsers(event);
    // case 'filters': return await retrieveFilterList(event);
    // case 'content_report': return await sendContentReport(event);
  }

}
