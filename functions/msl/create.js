const faunadb = require('faunadb')
var net = require('net');
const { checkServerIdentity } = require('tls');

/* configure faunaDB Client with our secret */
const q = faunadb.query
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
})

// May not be reliable... see discusson here:
// https://github.com/nodejs/node/issues/5757#issuecomment-549761128
// Could end up running up an expsneive bill due to hanging sockets
function attemptConnection(ip, port) {
  return new Promise((resolve, reject) => {
    var socket = new net.Socket();
    socket.setTimeout(1000, () => socket.destroy());
    socket.once('connect', () => {
      socket.destroy();
      resolve();
    });
    socket.once('error', ()=>{
      console.log("CONNERR");
      reject();
    })
    socket.connect(port, ip);    
  });
}

/* export our lambda function as named "handler" export */
exports.handler = async (event, context) => {
  /* parse the string body into a useable JS object */
  const { name, port }  = event.queryStringParameters;
  const ip = event.headers['client-ip'];

  // do a connection check to verify this new server.
  return attemptConnection(ip, port).then(()=>{
    const data = { ip, name, port }

    /* construct the fauna query */
    return client
      .query(q.Create(q.Ref('classes/servers'), { data }))
      .then(response => {
        /* Success! return the response with statusCode 200 */
        return {
          statusCode: 200,
          body: "Added to master server list",
        }
      })
      .catch(error => {
        /* Error! return the error with statusCode 400 */
        return {
          statusCode: 400,
          body: JSON.stringify(error),
        }
      })
  }).catch(()=>{
    return {
      statusCode: 400,
      body: "Failed to connect to "+ip+":"+port+"\n",
    }
  })
}