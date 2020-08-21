const faunadb = require('faunadb')
var net = require('net');
const { checkServerIdentity } = require('tls');
const { errorMonitor } = require('stream');

/* configure faunaDB Client with our secret */
const q = faunadb.query
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
})

exports.handler = async (event, context) => {
  let sp = event.path.split('/');
  let command = sp[sp.length-1];
  console.log(command);
  switch (command){
    case 'online': return runGoOnline(event);
    case 'offline': return await runGoOffline(event);
    case 'msl': return await runGetList();
    case 'banned': return await isBannedUser(event);
    case 'refresh': return await refreshAllServers();
  }

}


async function refreshAllServers() {

  async function refresh(fin) {
    await refreshServer(fin.data.ip, fin.data.port)
  }

  async function refreshServer(ip, port) {
    console.log("refreshing " + ip)
      let timeoutId = setTimeout(()=>{
      }, 3000);
      var socket = new net.Socket();
      socket.setTimeout(3000, () => socket.destroy());
      socket.once('connect', () => {
        clearTimeout(timeoutId);
        socket.write("REFRESH\0")
        
      });
      socket.once('error', ()=>{
        clearTimeout(timeoutId);
      })
      socket.connect(port, ip);    
  }

  let response = await client.query(q.Paginate(q.Documents(q.Collection('serverlist'))));
  
  const itemRefs = response.data
  // create new query out of item refs. http://bit.ly/2LG3MLg
  const getAllItemsDataQuery = itemRefs.map(ref => {
    return q.Get(ref)
  })
  // then query the refs
  let qdata = await client.query(getAllItemsDataQuery);
  
  await qdata.map(refresh);


  return {
    statusCode: 200,
    body: "refreshed"
  }  

}


async function isBannedUser(event) {
  let { ip, uuid }  = event.queryStringParameters;

  var banned = await client.query(q.Exists(q.Match(q.Index('banned_users_by_ip'), ip)));
  if(banned) {
    return {
      statusCode: 403,
      body: "This user is banned.",
    }
  }

  banned = await client.query(q.Exists(q.Match(q.Index('banned_users_by_uuid'), uuid)));
  if(banned) {
    return {
      statusCode: 403,
      body: "This user is banned.",
    }
  }

  return {
    statusCode: 200,
    body: "This user is not banned.",
  }
}


async function runGoOnline(event) {
  const ip = process.env.LOCAL_DEV_IP_SINCE_BROKEN_IN_DEV || event.headers['client-ip'];

  // socket.setTimeout Unreliable for this purpose, this guy is correct:
  // https://github.com/nodejs/node/issues/5757#issuecomment-549761128
  // So this has some added code for timeout enforcement...
  async function attemptConnection(ip, port) {

    return new Promise((resolve, reject) => {
      let timeoutId = setTimeout(()=>{
        reject(new Error("socket connect timeout"));
      }, 1000);
      var socket = new net.Socket();
      socket.setTimeout(1000, () => socket.destroy());
      socket.once('connect', () => {
        clearTimeout(timeoutId);
        resolve();
        socket.destroy();
      });
      socket.once('error', ()=>{
        clearTimeout(timeoutId);
        reject(new Error("socket connect timeout"));
      })
      socket.connect(port, ip);    
    });
  }

  
  let { name, port, is_private }  = event.queryStringParameters;

  is_private = is_private == "true";

  if (!name || name.length < 3) {
    return {
      statusCode: 400,
      body: "name must be at least 3 characters",
    }
  }

  port = parseInt(port);

  
  if (port < 0 || port > 65535) {
    return {
      statusCode: 400,
      body: "not a valid port",
    }
  }

  let dupeExist = await client.query(q.Exists(q.Match(q.Index('serverlist_by_ip_and_port'), ip, port)));
  
  if (dupeExist) {
    let banned = dupeExist.data.banned;

    if(banned) {
      return {
        statusCode: 403,
        body: "Your server has been banned from the MSL.",
      }
    }
  }


  try {
    console.log("making connection attempt to",ip, port);
    // do a connection check to verify this new server.
    await attemptConnection(ip, port);

    console.log("connection attempt succeeded");

    let existingItem = null;

    // find existing item w that ip and port
    
    if (dupeExist) {
      let existingItem = await client.query(q.Get(q.Match(q.Index('serverlist_by_ip_and_port'), ip, port)));
      if (existingItem.data.name === name) {
        return {
          statusCode: 200,
          body: "server is already registered on the msl",
        }
      } else {
        // if there is already a server with the same port and ip
        // just update the name instead of creating an alias (functionally duplicate) entry
        console.log('attempt update');
        console.log(existingItem);
        await client.query(q.Update(existingItem.ref, { data:{ name } }));
        return {
          statusCode: 200,
          body: "server name changed",
        }
      }
    } else {
      // existing item not found, create it
      await client.query(q.Create(q.Collection('serverlist'), { data: {ip, name, port, is_private} }));
      return {
        statusCode: 201,
        body: "server added to the list"
      }
    }  
  } catch (error) {
    console.log(error);
    return {
      statusCode: 400,
      body: JSON.stringify(error),
    }
  }
}


async function runGoOffline(event) {
  const ip = process.env.LOCAL_DEV_IP_SINCE_BROKEN_IN_DEV || event.headers['client-ip'];

  let { port }  = event.queryStringParameters;

  port = parseInt(port);

  if (port < 0 || port > 65535) {
    return {
      statusCode: 400,
      body: "not a valid port",
    }
  }
  try {
    let existingItem = null;
    // find existing item w that ip and port
    let dupeExist = await client.query(q.Exists(q.Match(q.Index('serverlist_by_ip_and_port'), ip, port)));
    if (dupeExist && !dupeExist.banned) {
      let existingItem = await client.query(q.Get(q.Match(q.Index('serverlist_by_ip_and_port'), ip, port)));
      await client.query(q.Delete(existingItem.ref));
      return {
        statusCode: 200,
        body: "server removed",
      }
    } else {
      return {
        statusCode: 400,
        body: "nothing to remove"
      }
    }
  } catch (error) {
    console.log(error);
    return {
      statusCode: 400,
      body: JSON.stringify(error),
    }
  }
}

// Note that by default a page is 64 items. at that point we will need to come back here
// and revisit the faunadb docs on the paginate function
// https://docs.fauna.com/fauna/current/api/fql/functions/paginate
async function runGetList() {

  function faunaToGchatProtoStyle(fin) {
    const { ip, name, port, banned, is_private } = fin.data;
    if(!banned && !is_private) {
      return `SERVER::!!::${name}::!!::${ip}::!!::${port}`;
    }
  }

  let items = [];
  try {

    let response = await client.query(q.Paginate(q.Documents(q.Collection('serverlist'))));
  
    const itemRefs = response.data
    // create new query out of item refs. http://bit.ly/2LG3MLg
    const getAllItemsDataQuery = itemRefs.map(ref => {
      return q.Get(ref)
    })
    // then query the refs
    let qdata = await client.query(getAllItemsDataQuery);
    
    return {
      statusCode: 200,
      body: qdata.map(faunaToGchatProtoStyle).join('\n')
    }  
  } catch (error) {
    console.log('error', error)
    return {
      statusCode: 400,
      body: JSON.stringify(error),
    }
  }
}
