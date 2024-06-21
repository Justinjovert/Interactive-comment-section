
const SESSION_USER = 'juliusomo'



const cloneSection = document.getElementById('clone-this-section')


// Checks user session and change accordingly
const user_session = () => {
    const allCommentCards = document.querySelectorAll('[data-id]')

    // Changes session with value of SESSION_USER as user
    allCommentCards.forEach(commentCard => {
        // If it matches, change "reply" button to "edit" and "delete"
        if (commentCard.querySelector('[data-username]').textContent === SESSION_USER) {
            const buttonReply = commentCard.querySelector('.reply')
            if (buttonReply) {
                const thisStyle = window.getComputedStyle(buttonReply)
                if (thisStyle.display !== 'none') {
                    buttonReply.style.display = 'none'
                    const cloneElement = cloneSection.content.querySelector('.useroptions-container').cloneNode(true)
                    const container = buttonReply.parentNode
                    const buttonsClone = Array.from(cloneElement.childNodes)
                    buttonsClone.forEach(button => {
                        container.appendChild(button)
                    })
                }
            }
        }
    })
}

// Create a comment card
const createCommentCard = (dataComment) => {
    const commentCard = cloneSection.content.querySelector('.comment-card').cloneNode(true)
    commentCard.dataset.id = dataComment.id
    commentCard.querySelector('[data-upvotes]').textContent = dataComment.score
    commentCard.querySelector('[data-user-avatar]').src = dataComment.user.image.webp
    commentCard.querySelector('[data-username]').textContent = dataComment.user.username
    commentCard.querySelector('[data-timestomp]').textContent = dataComment.createdAt
    commentCard.querySelector('[data-comment-content]').textContent = dataComment.content
    return commentCard
}


// Create a comment
const commentSection = document.querySelector('.comment-section-container')
const userinput = commentSection.querySelector('.userinput')
const createComment = (dataComment) => {
    // Create a new article comment container
    const newCommentContainer = document.createElement('article')
    newCommentContainer.classList.add('comment-container')

    // And set data
    const newCommentCard = createCommentCard(dataComment)
    newCommentContainer.appendChild(newCommentCard)
    commentSection.insertBefore(newCommentContainer, userinput)


    // If reply exists
    // Create a data
    if (dataComment.replies.length >= 1) {
        const replies = document.createElement('div')
        replies.classList.add('replies-to-parent')
        const line = document.createElement('div') // Reply line
        line.classList.add('line')                 // Interactable
        replies.appendChild(line)
        dataComment.replies.forEach(reply => {
            const replyCard = createCommentCard(reply)
            replies.appendChild(replyCard)
        })
        newCommentContainer.appendChild(replies)
    }
}

//  Count how many comments
function countComments(data) {
    let count = 0;

    function recurse(comments) {
        comments.forEach(comment => {
            count++;
            if (comment.replies && comment.replies.length > 0) {
                recurse(comment.replies);
            }
        });
    }

    recurse(data.comments);
    return count;
}

let existingIDs = 0
// Fetch data.json on the same directory
document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("404 Data not found!")
            }
            return response.json()
        })
        .then(data => {
            existingIDs = countComments(data)
            const comments = data.comments
            comments.forEach(dataComment => {
                createComment(dataComment)
            })
            user_session()
        })
        .catch(error => {
            console.error("404 Data not found!", error)
        })
})


// Base on data.json
// Make new ID
const newID = () => {
    let new_id = existingIDs + 1
    existingIDs = new_id
    return new_id
}



// create object
const createDataObj = (thisUserinput) => {
    const commentContent = thisUserinput.querySelector("textArea").value
    if (commentContent != '') {
        const currentUser = thisUserinput.querySelector('.userinput-avatar')
        const currentUsername = currentUser.dataset.userinputUsername
        const currentUserAvatar = currentUser.querySelector('img').getAttribute('src')
        const commentID = newID()


        const object = {
            "id": commentID,
            "content": commentContent,
            "createdAt": "1 month ago",
            "score": 0,
            "user": {
                "image": {
                    "png": "",
                    "webp": `./${currentUserAvatar}`
                },
                "username": currentUsername
            },
            replies: []
        }
        console.log(object.user.image.webp)
        const commentCard = createCommentCard(object)
        return commentCard
    }
}

// When user replies to an existing comment
// Using event delegation, trace user id and create reply container
commentSection.addEventListener('click', event => {
    // If target is reply button
    if (event.target.classList.contains('reply')) {
        const commentParent = event.target.closest('[data-id]')
        const parentComment = commentParent.closest('article')

        // If there isn't an active reply container
        if (!commentParent.parentNode.querySelector('.userinput')) {
            // Create a reply container
            const replyContainer = cloneSection.content.querySelector('.userinput').cloneNode(true)

            // Get username and ID
            const parentID = commentParent.dataset.id
            const parentUsername = commentParent.querySelector('[data-username]').textContent
            replyContainer.getElementsByTagName('textArea')[0].value = `@${parentUsername} `
            replyContainer.dataset.parentid = parentID

            // If it is a reply to a reply
            if (commentParent.parentNode.classList.contains('replies-to-parent')) {
                commentParent.parentNode.insertBefore(replyContainer, commentParent.nextElementSibling)
            }
            else {
                parentComment.insertBefore(replyContainer, commentParent.nextElementSibling)
            }
        }
    }

    // If target is SEND button
    // Posting a comment / reply
    if (event.target.tagName === 'BUTTON' && event.target.parentNode.classList.contains('userinput')) {
        if (event.target.id == 'newComment') {
            // Extract data
            const thisUserInput = event.target.parentNode
            const commentContent = thisUserInput.querySelector("textArea").value
            // If userinput is not empty
            // Create a comment card with user comment content and data
            // Then append before user input container
            if (commentContent != '') {
                const comment = createDataObj(thisUserInput)
                const newCommentContainer = document.createElement('article')
                newCommentContainer.classList.add('comment-container')
                newCommentContainer.appendChild(comment)
                commentSection.insertBefore(newCommentContainer, userinput)
            }
            console.log('New comment')
        }
        else {
            // Look for parent comment ID, add object in reply array
            const parentID = event.target.closest('.userinput').dataset.parentid
            const dataID = `[data-id="${parentID}"]`
            //const replyContainer = document.querySelector(dataID).parentNode.querySelector('.replies-to-parent')
            const thisUserInput = event.target.closest('.userinput')
            const parentCommentContainer = thisUserInput.closest('.comment-container')
            let replyContainer = parentCommentContainer.querySelector('.replies-to-parent')
            // Create reply container if it doesn't exist
            if (replyContainer === null) {
                parentCommentContainer.insertAdjacentHTML('beforeend', '<div class = "replies-to-parent"><div class="line"></div></div>')
                replyContainer = parentCommentContainer.querySelector('.replies-to-parent')
            }
            replyContainer.appendChild(createDataObj(thisUserInput))
            console.log('New reply')
            thisUserInput.remove()  // Remove reply container 
        }
    }
    user_session()
})



