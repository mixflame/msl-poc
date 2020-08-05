const faunadb = require('faunadb')
var net = require('net');
const { checkServerIdentity } = require('tls');

/* configure faunaDB Client with our secret */
const q = faunadb.query
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
})

function attemptConnection(ip, port) {
  return new Promise((resolve, reject) => {
    var socket = new net.Socket();
    socket.setTimeout(1000, () => socket.destroy());
    socket.once('connect', () => {
      socket.destroy();
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
        console.log('success', response)
        /* Success! return the response with statusCode 200 */
        return {
          statusCode: 200,
          body: JSON.stringify(response),
        }
      })
      .catch(error => {
        console.log('error', error)
        /* Error! return the error with statusCode 400 */
        return {
          statusCode: 400,
          body: JSON.stringify(error),
        }
      })

  }).catch(()=>{
    console.log("CONNERR");
    return {
      statusCode: 400,
      body: "Failed to connect to "+ip+":"+port+"\n",
    }
  })

 

}
