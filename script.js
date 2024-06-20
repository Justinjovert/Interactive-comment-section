
const SESSION_ID = 4



const cloneSection = document.querySelector('.clone-this-section')


// Checks user session and change accordingly
const user_session = () => {
    const allCommentCards = document.querySelectorAll('[data-userID]')

    // Changes session with value of SESSION_ID as user
    allCommentCards.forEach(commentCard => {
        // If it matches, change "reply" button to "edit" and "delete"
        if (Number(commentCard.dataset.userid) === SESSION_ID) {
            const buttonReply = commentCard.querySelector('.reply')
            if (buttonReply) {
                const thisStyle = window.getComputedStyle(buttonReply)
                if (thisStyle.display !== 'none') {
                    buttonReply.style.display = 'none'
                    const cloneElement = document.querySelector('.useroptions-container').cloneNode(true)
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
    const commentCard = cloneSection.querySelector('.comment-card').cloneNode(true)
    commentCard.dataset.userid = dataComment.id
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


document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("404 Data not found!")
            }
            return response.json()
        })
        .then(data => {
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


