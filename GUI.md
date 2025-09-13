## Overview

Language learning app which uses react native and expo to run across web, iOS and Android. The application focuses on being a flashcard application which shows a user a flashcard, and when the flip the flashcard the word is spoken by the app. In addition the app will be able to provide users with a full sentence in their native language, they will then attempt to say the sentence and they can flip the card and the app will play the sentence.

It’s important to note that the majority of the app functionality is hosted on the backend. The App is primarily a frontend and itself does not provide a lot of smarts. Keep caching to a minimum and local storage to a minimum. 

Let me walk you though the user journey for the application. 

The API for the project is a FastAPI located in the api folder. Dont make edits to the API folder without asking me.

### Step 1 - First Login.

The application will only use social logins which will be Facebook, Google, Apple and Twitter. After a user authenticates with once of these providers they will be prompted to select a native language, this by default should be the native language of their device if that language is one of the supported languages. The app supports English, Spanish, German, Italian, Portuguese, Russian, Chinese, Japanese and Korean.  Once the user has selected/confirmed their native language, then they need to pick their study language. The selection of both the native and study language should have all the languages laid out in a grid with a flag and the name of the language in English. At this stage the app is not internationalised and the app itself is in English. After authenticating, and selecting their native and study language, the app will exchange the token with the FastAPI backend on the /auth/social-login path. The FastAPI backend will then provide a JWT which the GUI can use interact with the API. Authenticating to /auth/social-login will cause a user account to be created if it did not already exist, but the Frontend must still use the API to set the study and native language of the users. After this process the user will be navigated to the dashboard.

### Step 2 - The Dashboard.

The dashboard is where a user is placed after they login, or were they are placed when they are already authenticated and they open the application.

The top of the page should have “Welcome” + the users name, “time to practice” + the study language with the flag.

Under this is a row of three box’s which container the number of words the user currently based on their current native and study language selection. The middle box contains the number of words which the user has in deep memory.  The last box contains their current streak (the number of days they have done practice in a row). Each of these number are pulled from the API using the specific API for getting this number.

Under the row of three box’s is a chart showing the last month of progress, there will be a line which is the number of words in deep memory (words they know well), and a bar chart (in the same diagram) which shows the number of minutes study per day. For now make this chart contain fake data or be empty, the backend API is not ready for this feature so create an object in the GUI as a place holder.

Under the graph is a button which is the whole width, labeled "Practice Words” which will take users to the word practice screen. If the user does not have any words, then instead of taking the user to the practice words screen, a modal will appear which tells the user they must add words before they can practice, this model will contain a link to the explore page which is where the user add words.

Under that button is another button labeled “Practice Speaking” which will take the user to the practice speaking page. If the user does not have any words, then instead of taking the user to the practice words screen, a modal will appear which tells the user they must add words before they can practice, this model will contain a link to the explore page which is where the user add words.

There is a bottom/footer bar which contains some navigation options. The first option is home. Second is word practice, third is sentence practice, fourth explore page, final item is profile.

###  Practice Words Screen

This is the flashcard screen where users will practice words. The idea is that the frontend will pull a random translation from the API and display the native word on the flashcard along with the image associated with the native word. The images are hosted as static files where the name of the file is the SHA-512 hash of the native phrase, if the image does not exist then the GUI should just show a grey box in its place. When the user flips the flashcard by click on the card, pressing the up arrow or pressing the w key, the sound associated with the study phrase will play. The sound associated with the study word are hosted as static mp3 files with the file name being the SHA-512 hash of the study word. After the card is slipped the user can say they did not know the word by shipping left, pressing the a key or by pressing the left arrow. The user can indicate they knew the word by swiping right, pressing the d key or by pressing the right. After they have dismissed the word in this way a new flashcard will appear and the cycles continues.

At the bottom of the page is a box containing very short instructions on how to use the flashcard functionality.

### Explore Screen.

The explore screen is for users to determine which words they want to study. The API has a number of catalogues which will be displayed on the explore page. These are grouped by their difficulty.

The levels are, and each category contains this many words.

    A1 - 500 words
    A2 - 500 words
    B1 - 1000 words
    B2 - 2000 words
    C1 - 4000 words


Within each category there are a number of catalogues. Each with a different theme. Each catalogue has an image associated with it, the image is stored in static storage and the file name Is the SHA-512 hash of the name of the catalogue.

The explore page should be Laid out with Explore at the top of the page and 5 expandable box’s. When a user expands a box then a grid of catalogues should be displayed with their name and image. The grid should be 3 wide, and as deep as required to display all the catalogues relevant. The image and name of the catalogue should be displayed in the box in the grid. Each level is normally non expanded unless the user manually expands it.

If the user clicks on one of the catalogues then they get taken to the catalogue screen.

### Catalogue Screen

The catalogue screen is a 4 wide grid of all the translations in the catalogue with the associated image based on the native word in each translation. When the user clicks on a word it is added so they can practice with it. Words which they have added should be highlighted. If a user clicks on a highlighted word, ie one that is already added, then clicking on it should both remove it and unhighlight the word.

### Profile Screen.

This is a screen where the user  changes their settings. Their name is displayed along with their current native language and current study language. Clicking on their the study language or native language will result in a modal appearing where the user can change languages. The user cannot have the same study and native language, so for example if the users current native language is Spanish, then Spanish is not an option in the study language screen, and vice versa. There is also a logout button on this page.