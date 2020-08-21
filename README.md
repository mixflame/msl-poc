## production usage

This is a master server list running on netlify functions using faunadb for persistence.

The following are simple GET requests. Your IP is determined automatically and your port checked to make sure it can be connected to. The timeout for this connection is one second. You can have multiple servers (with different port numbers) running on a single IP address. The system will not allow you to register the same IP and Port twice (for example, with different names, otherwise known as aliases. Aliases are disabled. One name per server/port combination so the server list won't have duplicate entries for the same host/port combination.

**How to get the current list:**

`https://nervous-shockley-ec99bc.netlify.app/.netlify/functions/msl`

It will return a list in the following format:

```
SERVER::!!::exampleOne::!!::1.2.3.4::!!::9994
SERVER::!!::exampleTwo::!!::34.25.15.44::!!::9617
```

**How to add your server to the list:**

From the server, execute, mind the name and port params:

`https://nervous-shockley-ec99bc.netlify.app/.netlify/functions/msl/online?name=#{chatnet_name}&port=#{port}`

**How to change server name**:

Add it to the list with the same port number, name will change. Dupes will not be added.

**How to delete a server:**

Since you can have multiple entries per server using various ports, you must specify the port you want to delete the entry for.

`https://nervous-shockley-ec99bc.netlify.app/.netlify/functions/msl/offline?port=#{port}`


## development

see https://docs.fauna.com/fauna/current/tutorials/crud.html

get the `netlify` command line tool

Setup the schema: 

`netlify dev:exec functions/msl/create-schema.js`

Test creating something

`curl -XPOST "http://localhost:8888/.netlify/functions/msl/online?name=foouuu&port=9617"`

Test name change

`curl -XPOST "http://localhost:8888/.netlify/functions/msl/online?name=bazouuu&port=9617"`

Test retrieving the list

`curl "http://localhost:8888/.netlify/functions/msl"`

Test deleting

`curl "http://localhost:8888/.netlify/functions/msl/offline?port=9617"`

### deployment

netlify functions must be deployed using the `netlify deploy` command

## things that might become important later

https://community.netlify.com/t/functions-abuse-prevention/17814/4


# How to Admin

## Global Server Ban

Add `banned: true` to the server in the `serverlist` on FaunaDB and click https://wonderful-heyrovsky-0c77d0.netlify.app/.netlify/functions/msl/refresh

## Global User Ban

Add `{"ip": "<ip to ban>"}` to the `banned_users` collection in Fauna. Can also be banned by UUID. And run refresh https://wonderful-heyrovsky-0c77d0.netlify.app/.netlify/functions/msl/refresh