
## Inspiration
I live in an area that is visited by many a variety of birds (and squirrels). I thought it wold be interesting to explore the abilities of Amazon's DeepLens to be able to identify bird species by both visual and song characteristics as well as keep track of how many squirrels disrupt the feeders each day.

I had a difficult time finding good seed image libraries for bird species and wanted to get my hands dirty with this new hardware. I thought I could leverage the ease of getting a sample project running on DeepLens to do a course collection of bird images that I could further develop into my species identification model.
![enter image description here](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/625/datas/gallery.jpg)

![enter image description here](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/626/datas/gallery.jpg)
## What does the application do and goals of the project
The AWS DeepLens hardware allows locally running image processing to occur using models trained using a variety of machine learning methodologies. The graphics processing hardware allows for low latency video stream processing at the edge (i.e. disconnected from the cloud).

My application, using an included sample MXNet trained model (deeplens-object-detection), identifies the visitors to my bird feeders in my yard. The sample model is able to identify birds with reasonable accuracy. There is no classification for squirrels in this model but they score relatively likely against the "cat" and "dog" classifier (this is a hackathon, isn't it?). Upon a high identification probability score of recognizing a bird or a squirrel, a message is published to a message topic (MQTT) where a lister process will tally the counts and store them to a database where a daily squirrel vs. bird scorecard can be accessed via the web.

![enter image description here](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/745/datas/gallery.jpg)

> The output isn't pretty but it shows your running identification counts.

This trigger could be extended to take some physical action to deter the squirrel from the feeder, however I am less concerned with that and more interested in collecting positive bird species samples for a more specific bird model.

Initially I utilizes a pre-trained model, but this is the first step in a broader project that is a "train the trainer" application. Using existing coarse models as the source for generating new seed images to train a new model using AWS SageMaker, in this case, to specifically identify bird species.

Check out this video of the detection: [youtube](https://www.youtube.com/watch?v=3Q6jayeE3qY)

This project will give you some information about the DeepLens framework, hardware and a references to a guide for setting up your own device and customizing a model to do your own detection.

I encourage you to use it as a starting point to exploring this platform. The code to this project can be found on github at [https://github.com/plangdon/deeplens_birds](https://github.com/plangdon/deeplens_birds).

The architecture of this solution can be adapted to support your trained model and notification/action pipeline.

### Solution Architecture
In designing this architecture, I had the following goals:
* Push as much processing and resource utilization to "the edge"
    * video bandwidth is large, sending video stream to cloud for processing would be expensive and have high latency
    * notifications or counts are orders of magnitude smaller than video and easy sent to cloud for storage and action
    * constant video processing in the cloud would incur lots of CPU costs
* Support image capture locally so device could be deployed to remote location without 100% connectivity or on low-bandwidth networks (cellular)
     * images captured of birds would be incorporated into future training for specific species identification
     * locally stored images can be off-loaded from device on demand when network is enabled or physically removed via removable media (sneaker-net)
* Support notifications to the cloud using secure, messaging protocol

![Solution Architecture](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/685/datas/gallery.jpg)

1. Running on the AWS DeepLens is [Greengrass Core](https://docs.aws.amazon.com/greengrass/latest/developerguide/what-is-gg.html) allowing Lambda code to run on  DeepLens hardware.
2. [Lambda](https://aws.amazon.com/lambda/) code deployed to DeepLens processes the image recognition/inference from the loaded model, handles the secure messaging to AWS IoT and saves local files when identification criteria is met.
3. Messages are  published to [AWS IoT](https://docs.aws.amazon.com/iot/latest/developerguide/what-is-aws-iot.html) using MQTT
4. [AWS IoT Rules](https://docs.aws.amazon.com/iot/latest/developerguide/iot-rules.html) forward detection data to DynamoDB
5. [DynamoDB](https://aws.amazon.com/dynamodb/) stores timestamp and probability scores from detected animals
6. Inside of [Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/), a Node.js web server hosts a page with the day's tally of bird and squirrel sightings stored on DynamoDB.

## Deep Lens Introduction
Chances are this is your first look at AWS DeepLens so I wanted to cover a quick intro to the hardware and the AWS components used in this project.

### Amazon DeepLens - What Is It?
According to Amazon, DeepLens is  "the world’s first deep learning enabled video camera for developers."
*From Amazon's DeepLens Portal: [AWS DeepLens Portal](https://aws.amazon.com/deeplens/)*

AWS DeepLens is a wireless video camera and API that you can use to learn how to use the latest Artificial Intelligence (AI) tools and technology and develop your own computer vision applications. Use AWS DeepLens to get hands-on experience using a physical camera that runs real-time computer vision models, examples, and tutorials. Get started with AWS DeepLens by using any of the pretrained models that come with your device. As you become proficienct, you can develop, train, and deploy your own models.


### AWS DeepLens Hardware and Framework

The AWS DeepLens camera, or device, uses deep convolutional neural networks (CNNs) to analyze visual imagery. You can use the device as a development environment to build computer vision applications. The device includes the following:
* A 4 megapixel camera with MJPEG
* 8 GB of on-board memory
* 16 GB storage capacity
* A 32 GB SD card
* WiFi support for both 2.4 GHz and 5 GHz standard dual-band networking
* A micro HDMI display port
* Audio out and USB ports

AWS DeepLens is powered by an Intel® Atom processor, which is capable of processing 100 billion floating point operations per second (GFLOPS). This gives you all of the compute power that you need to perform inference on your device. The micro HDMI display port, audio out, and USB ports allow you to attach peripherals so you can get creative with your computer vision applications.

----------

The AWS DeepLens device uses deep convolutional neural networks (CNNs) to analyze visual imagery. You use the device as a development environment to build computer vision applications.

**AWS DeepLens works with the following AWS services:**
* Amazon SageMaker, for model training and validation
* AWS Lambda, for running inference against CNN models
* AWS Greengrass, for deploying updates and functions to your device

AWS DeepLens is ready to use right out of the box. After you register AWS DeepLens, deploy a sample project, and begin using it to develop your own applications computer vision applications.

### How It Works:

The following diagram illustrates how AWS DeepLens works.
![How it works](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/454/datas/gallery.jpg)

* When turned on, the AWS DeepLens captures a video stream.
* AWS DeepLens produces two output streams:
    * **Device stream** – the video stream is passed through with no processing.
    * **Project stream** – the results of the model's processing video frames.  
      * The Inference Lambda function receives unprocessed video frames.
      * The Inference Lambda function passes the unprocessed frames to the project's deep learning model where they are processed.
      * The Inference Lambda function receives the processed frames back from the model and then passes the processed frames on in the project stream.
![Inference Output](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/459/datas/gallery.jpg)

### Hardware - Model AMDC-1

![Front View](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/456/datas/gallery.jpg)

![Side View](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/455/datas/gallery.jpg)

![Rear View](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/457/datas/gallery.jpg)

* **CPU**
     * Intel Atom® Processor
* **MEMORY**
    * 8GB RAM
*  **OS**
    * Ubuntu OS-16.04 LTS
* **BUILT-IN STORAGE**
    * 16GB Memory (expandable)
* **GRAPHICS**
    * Intel Gen9 Graphics Engine
* **POWER SUPPLY**
    * 5V - 4A



## Prerequisites and Setup

* You will need the DeepLens hardware to build this project.
* You will need an AWS account


### Getting Started - Device Registration
Amazon has a really good portal for the initial setup required to prepare your DeepLens and connect it to your network.

Before using AWS DeepLens, you must register your device, connect it, set it up, and verify that it's connected.
The following graphic shows where you perform each step:

![Registration Steps](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/458/datas/gallery.jpg)

The easy to follow guide can be found here:
[https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-getting-started.html](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-getting-started.html)

#### This is the outline of the steps you need to follow:

1. [Prerequisites](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-prerequisites.html)
2. [Register Your AWS DeepLens Device](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-getting-started-register.html)
3. [Connect AWS DeepLens to the Network](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-getting-started-connect.html)
4. [Set Up Your AWS DeepLens Device](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-getting-started-set-up.html)
5. [Verify That Your AWS DeepLens Is Connected](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-getting-started-verify-connection.html)

## How I built it

### 1. Training a Model with Amazon SageMaker

In this project I used a combination of sample models and trained my own model to further help in identification.
The following steps show how you can train your own model.

**Rather than replicate the detailed description of these steps here, please follow them on AWS.**
The instructions can be found on AWS at: [https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#import-model](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#import-model)

#### This is the outline of the steps you need to follow:

1. [Create an Amazon S3 Bucket](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#create-s3-bucket)
2. [Create an Amazon SageMaker Notebook Instance](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#create-sagemaker-notebook)
3. [Edit the Model in Amazon SageMaker](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#edit-model-sagemaker)
4. [Optimize the Model](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#optimize-model)
5. [Import the Model](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#import-model)
6. [Create a Lambda Function](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#create-lambda)
7. [Create a New AWS DeepLens Project](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#create-new-project)
8. [Review and Deploy the Project](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#deploy-project)
9. [View Your Model's Output](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-train-model.html#view-model-output)


## If you would like to try to replicate my project here are a few steps to follow:

### Configure AWS
I am assuming you have some experience of working with AWS, I am including links to help articles to each of the tasks. All services should be configured in the same VPC for security and roles management simplification.

#### Set Up DynamoDB - [DynamoDB Help](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
1. Log into AWS and navigate to DynamoDB service page [https://console.aws.amazon.com/dynamodb/home](https://console.aws.amazon.com/dynamodb/home)
2. Create a new table in DynamoDB named: "backyard_counter"

#### Set Up AWS IoT - [AWS IoT Help](https://docs.aws.amazon.com/iot/latest/developerguide/what-is-aws-iot.html)
1. Log into AWS and navigate to AWS IoT service page [https://console.aws.amazon.com/iot/home](https://console.aws.amazon.com/iot/home)
2.  Add a new rule to AWS - click "Act"
3. [Create Rule](https://docs.aws.amazon.com/iot/latest/developerguide/iot-create-rule.html)
4. Rule SQL:
 `SELECT * FROM '$aws/things/deeplens_xxxxxxxxxxxxxxx/infer'`
   * the topic name "deeplens_xxxxxxxxxxxxxxx" will be obtained from your deployed project, it is the bottom of the deployed project page - so this is a little "chicken/egg" scenario: you setup the rule first and just put in dummy field, then come back and update the rule after the project is deployed.
   ![Example of rule](https://challengepost-s3-challengepost.netdna-ssl.com/photos/production/software_photos/000/602/742/datas/gallery.jpg)

#### Set Up Elastic Beanstalk - [Elastic Beanstalk Help](https://aws.amazon.com/documentation/elastic-beanstalk/)
1. Log into AWS and navigate to Elastic Beanstalk service page [https://console.aws.amazon.com/elasticbeanstalk/home](https://console.aws.amazon.com/elasticbeanstalk/home)
2. Create an application and call it "birdreport"
3. Create an environment for your application to run, provide a unique name for your environment
4. Select "Node.js" as your platform
5. Upload the zip file of the web server code


### Configure DeepLens
#### Create a Lambda function
1. Log into AWS and navigate to Lambda service page [https://console.aws.amazon.com/lambda/home](https://console.aws.amazon.com/lambda/home)
2. On the far right click the orange "Create function" button
3. Name the function: "deeplens-bird-detection"
4. Choose Runtime: Python 2.7
5. Choose Existing Role: AWSDeepLensLambdaRole
6. Upload the zip file from my git project "deeplens-bird-detection.zip"
7. Confirm Handler is: "greengrassHelloWorld.function_handler"

#### Add your Project
1. Log into AWS and navigate to DeepLens service page [https://console.aws.amazon.com/deeplens/home](https://console.aws.amazon.com/deeplens/home)
2.  In left navigation under "Resources" - select "Projects"
3. On the far right click the orange "Create new project" button
4. For my project I am "Creating a new blank project" - click "Next"
5. Give your project a name, no spaces
6. Select the model and lambda function
    * to simplify this example, the "deeplens-object-detection" model has bird's as one of it's 20 recognizable objects, pick that one
    * pick the custom Lambda we created in the section above; "deeplens-bird-detection"   

#### Deploy your Project
1. From the project list, select your new named project radio button
2. Click the white "Deploy to device" button
3. Select your device radio button on the next page, and click "Review"
4. Confirm the data and click "Deploy"
5. Wait till your application is deployed (takes a few minutes)

----------
### Offline Documentation
* [Setup in PDF form](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-dg.pdf)
* [Developer Guide in PDF](https://docs.aws.amazon.com/deeplens/latest/dg/deeplens-dg.pdf)



## Challenges I ran into
Currently the SageMaker only supports training new models with Apache MXNext, I have had a little experience training model using Tensor Flow and was hoping to import my existing models. It was a good exercise for me looking at how MXNet works and expand my scope of ML frameworks. I look forward to the addition of future ML Frameworks to the DeepLens platform so I can continue trying them out to find the best options for the job.

## Accomplishments that I'm proud of
Even though I was able to quickly get up and running using the sample models, I was happy I took the extra time building out my own model using SageMaker and Jupyter notebooks. Python is not my strongest language and working with jupyter notebooks made it a little easier to work through the process. I recommend after you get a couple of the sample models up and running you take the time to train your own model as that really extends the value of this platform.


## What I learned
It was interesting to explore the Apache MXNet framework, I had previously used Tensor Flow and I like to make sure I am keeping on top of multiple options when considering technologies. Apache MXNet is a very mature project and active user community.

**More info on Apache MXNet:**
* [MXNet project site](https://mxnet.apache.org/)
* [MXNet github](https://github.com/apache/incubator-mxnet)

I learned how this customized hardware and software integration allows for very fast deployment of deep learning methodologies and a quick learning tool for developers to begin exploring the technical area.

I was also very happy to find the extensive documentation that was put together by the AWS DeepLens team. It was a very well documented step by step that was helpful when digging into a totally new platform.

## What's next for my project
This first pass of my project is great for weeding out the birds from the squirrels, but I am interested in extending the model to do more detailed identifications. The images captured during the first phase of the project will be a good resource as I extend the training to more specifically identify bird species.

As I mentioned above, currently the SageMaker platform only supports MXNet  models, I am interested in porting over my Tensor Flow trained models. Here is a link to my [git project](https://github.com/plangdon/tf_bird_species) with my training information for bird species identification using Tensor Flow.

I am also very interested in seeing if I can adapt the hardware to include bird songs as part of the identification criteria.
