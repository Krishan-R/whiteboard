# CO3201 Internet and Cloud Computing Assignment 2

This is a cloud-based, real-time and collaborative whiteboard allowing multiple users to draw on a canvas which can then be exported.

## About

This was built using Node.js with HTML/CSS/Javascript, with the user of sockets for communication between clients.
Clients can connect to the Node.js server using any modern web browser (Chrome/Firefox/Edge etc) through the designated port (8000 by default).
See the features section for more information about the functionality of the web application.

## Setup

You can deploy this web server using the popular Docker service by pulling the image and creating a container:

#### Docker CLI 
````
docker run -d \
  --name=whiteboard \
  -p 8000:8000 \
  --restart unless-stopped \
  iamafk/co3201-assignment2
````
This script will look for the image iamafk/co3201-assignment2 locally to create the container. If this cannot be found locally, the image will be pulled (downloaded) from the docker registry and stored locally for future containers.

#### Parameters

Container images are configured using parameters passed at runtime, which are seperated by a colon and indicate <external>:<internal> resources respectively.
For example `-p 6500:8000` would expose port 6500 to users whilst the container would access this data through port 8000.


| Parameter        | Function           |
| :-------------: |-------------|
| -d      | Runs container in detached mode, where the container is made and ran in the background, printing the container ID | 
| --name      | The name of the container for easy management      | 
| -p | The ports docker will publish to the host      | 
| --restart | The containers restart policy, e.g. always, no, unless-stopped, on-failure      |

#### Accessing the Web GUI

To access the whiteboard GUI, you need to use a modern browser, such as Chrome/Firefox/Edge, and browse to `ip:port`.
If you are accessing the whiteboard on the host machine, you can use localhost/127.0.0.1, otherwise you need to find the ip address of the host machine (e.g. 192.168.x.x if local).

The port will be the port you specified in the external port section of the docker run command e.g. `-p 6500:8000` would be accessed in the browser using the port 6500.

#### Updating the Application

If there any future updates, you can easily update your docker image to run updated containers:

1. Update the image: `docker pull iamafk/co3201-assignment2`
2. Stop the running container(s): `docker stop whiteboard`
3. Delete the container(s): `docker rm whiteboard`
4. Recreate the container with the newly pulled image using the instructions above
5. You can remove old images that are not being used by a container: `docker image prune`

You can also use tools like Watchtower to automatically update your images, however you will have to look into those separately. 

## Troubleshooting

#### The container name "XXXXX" is already in use

You already have a container with the name "XXXXX", please try to run the `docker run` script above with a different name. You can use `docker container ls -a` to see the list of all your containers.

#### Driver failed programming external connectivity on endpoint "XXXXX"

You already have a container running with the desired external port, causing a conflict. Please try creating the container using a different external port.

#### Only the leader can draw on the whiteboard

The leader must select users to draw on the whiteboard. To do this, the leader can click on specific users on the list next to the whiteboard. Promoted users will have their username highlighted red to indicate drawing privileges.

#### The whiteboard is saved before users have a chance to vote

The system is designed so that as soon as 50% of the users vote to save the whiteboard, it automatically gets downloaded. If this threshold has been reached, regardless of if there are users left to vote, the current whiteboard will be downloaded.