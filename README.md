How to add your server to the list:

From the server, execute, mind the name and port params:

`curl -XPOST -H"Content-Length: 0" "https://nervous-shockley-ec99bc.netlify.app/.netlify/functions/msl/create?name=tinySaloon&port=9617"`

How to get the current list:

`curl https://nervous-shockley-ec99bc.netlify.app/.netlify/functions/msl`

How to delete a server:

Not changed from the generator sample.