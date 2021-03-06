import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { changePage } from 'js/actions/index-actions'
import styled from 'styled-components'
import pages from 'js/constants/pages'
import colors from 'js/constants/colors'
import embedProperties from 'js/constants/embed'
import PropTypes from 'prop-types'
import parser from '../../../utils/textParser'
import testFilters from '../Filters/util/filters'
import { isHiddenProperty } from 'js/constants/hiddenArticleProperties'

const mapStateToProps = state => {
  return {
    defaultConfig: state.defaultConfig,
    articleList: state.articleList,
    guildId: state.guildId,
    feedId: state.feedId,
    subscribers: state.subscribers,
    bot: state.bot
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setToThisPage: () => dispatch(changePage(pages.MESSAGE))
  }
}

function numberToColour (number) {
  const r = (number & 0xff0000) >> 16
  const g = (number & 0x00ff00) >> 8
  const b = (number & 0x0000ff)
  return `rgb(${r},${g},${b})`
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  /* flex-direction: row; */
  background: #36393f;
  border-radius: 4px;
  border-style: solid;
  border-width: 1px;
  border-color: ${colors.discord.darkButNotBlack};
  padding: 20px 0;
`
const Username = styled.span`
  font-weight: 600;
  letter-spacing: 0;
`

const UserInfo = styled.div`
  display: flex;
  flex-direction: row;
  height: 22px;
  > div {
    height: 40px;
    width: 40px;
    border-radius: 50%;
    margin-top: -2px;
    /* margin-left: 20px; */
    margin-right: 20px;
    margin-bottom: 20px;
    margin-left: 20px;
    background-image: ${props => `url('${props.avatar}')`};
    background-size: 100%;
  }
  > h2 {
    color: white;
    font-size: 16px;
    margin: 0;
    white-space: nowrap;
    line-height: 16px;
    > span:first-child {
      line-height: 22px;
    }
  }
`

const Content = styled.div`
  margin-top: 0.5em;
  margin-left: 80px;
  margin-right: 10px;
  color: #dcddde;
  word-break: break-word;
  overflow-x: auto;
  font-size: 16px;
`

const Embed = styled.div`
  display: flex;
  flex-direction: row;
  /* max-width: 426px; */
  margin-top: 8px;
  margin-bottom: 5px;
`
// ${props => props.appeaseImage ? '426px' : '520px'};
const Pill = styled.div`
  display: block;
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
  width: 4px;
  background-color: ${props => props.color != null ? numberToColour(props.color) : '#4f545c'};
`
const NonPill = styled.div`
  padding: 8px 16px 16px;
  padding-bottom: 16px;
  background-color: rgba(46,48,54,.3);
  border-bottom-right-radius: 3px;
  border-top-right-radius: 3px;
  display: inline-grid;
  grid-template-columns: auto;
  grid-template-rows: auto;
`

const Author = styled.div`
  grid-column: 1/1;
  display: flex;
  align-items: center;
  color: white;
  margin-bottom: 4px;
  margin-top: 8px;
  word-break: break-all;
  font-weight: 600;
  line-height: 1.375;
  img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-right: 8px;
  }
  a {
    color: white;
    &:hover {
      color: white;
    }
  }
`

const Title = styled.a`
  font-weight: 700;
  font-size: 16px;
  word-break: break-all;
  margin-top: 8px;
  line-height: 1.375;
  grid-column: 1/1;
`

const Description = styled.div`
  margin-top: 8px;
  color: hsla(0,0%,100%,.6);
  grid-column: 1/1;
`

const Image = styled.a`
  display: block;
  margin-top: 16px;
  grid-column: 1/1;
  border-radius: 4px;
  img {
    max-width: 400px;
  }
`

const Thumbnail = styled.a`
  display: block;
  margin-left: 16px;
  grid-row: 1/8;
  grid-column: 2/2;
  margin-top: 8px;
  img {
    max-width: 80px;
    border-radius: 4px;
  }
`

const Footer = styled.div`
  display: flex;
  margin-top: 8px;
  font-size: 12px;
  align-items: center;
  color: ${colors.discord.subtext};
  font-weight: 500;
  word-break: break-all;
  grid-column: 1/1;
  img {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    border-radius: 50%;
  }
`

const BotTag = styled.span`
  background-color: rgb(114,117,217);
  border-radius: 3px;
  margin-left: 4.8px;
  margin-top: 0.75px;
  padding: 1.152px 4.4px;
  text-transform: uppercase;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.3;
`

const TimeTag = styled.span`
  color: hsla(0,0%,100%,0.2);
  font-size: 12px;
  font-weight: 400;
  margin-left: 0.3rem;
`

const EmbedFields = styled.div`
  margin-top: 8px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  grid-column: 1/1;
  display: grid;
  grid-gap: 8px;
  line-height: 18px;
`

const EmbedField = styled.div`
  /* margin-top: 6px; */
  margin-right: 6px;
  /* flex: ${props => props.inline ? 1 : 0}; */
  /* min-width: ${props => props.inline ? '150px' : '100%'}; */
  /* ${props => props.inline ? 'flex-basis: auto' : ''}; */

  grid-column: ${props => props.gridColumns};
`

const EmbedFieldTitle = styled.div`
  color: ${colors.discord.subtext};
  /* font-size: 0.875rem; */
  font-weight: 500;
  margin-bottom: 2px;
  font-size: 14px;
`

const EmbedFieldValue = styled.div`
  color: hsla(0, 0%, 100%, .6);
  /* font-size: 0.875rem; */
  font-weight: 400;
  white-space: pre-line;
  font-size: 14px;
`

class Message extends Component {
  convertKeywords (word) {
    const { articleId, articleList, guildId, feedId, subscribers } = this.props
    const article = articleList[articleId]

    if (word.length === 0) return word
    let content = word
    for (const placeholderName in article) {
      if (isHiddenProperty(placeholderName)) continue
      if (placeholderName === 'subscriptions') continue
      const sanitizedPlaceholderName = `{${placeholderName.replace('regex:', '')}}`
      // console.log('replacing', sanitizedPlaceholderName, 'with', article[placeholderName])
      content = content.replace(sanitizedPlaceholderName, article[placeholderName])
    }
    // Do not replace it with article.subscriptions since it may be outdated after updating subscriptions from the subscriptions page. It will not be updated until another article fetch has occurred.
    if (content.includes('{subscriptions}') && feedId && guildId) {
      const feedSubscribers = []
      const thisSubscribers = subscribers[guildId][feedId]
      for (const id in thisSubscribers) {
        const subscriber = thisSubscribers[id]
        const hasFilters = subscriber.filters && typeof subscriber.filters === 'object' && Object.keys(subscriber.filters).length > 0
        if (!hasFilters) feedSubscribers.push(`<@${id}> `)
        else if (article && testFilters(subscriber.filters, article).passed) feedSubscribers.push(`<@${id}>`)
      }
      content = content.replace('{subscriptions}', feedSubscribers.length > 0 ? feedSubscribers.join(' ') : '')
    }
    return content
  }

  render () {
    const { embeds, message, articleId, articleList, bot, defaultConfig } = this.props
    const embedElements = []
    const article = articleList[articleId]
    let hasEmbeds = false

    for (let i = 0; i < embeds.length; ++i) {
      const properties = embeds[i]
      const parsedProperties = {}
      let populatedEmbed = false
      for (const propertyName in embedProperties) {
        const propName = embedProperties[propertyName]
        if (properties[propName] === undefined) continue
        parsedProperties[propName] = article && propName !== 'color' ? this.convertKeywords(properties[propName]) : properties[propName] // color is a number
        populatedEmbed = populatedEmbed || !!properties[propName]
      }
      const fields = properties.fields
      const fieldElements = []
      if (fields) {
        const validFields = fields.filter(field => field.title && field.value)
        const lookedAt = new Set()
        const gridColumnValues = []
        for (let i = 0; i < validFields.length; ++i) {
          const field = validFields[i]
          if (!populatedEmbed) {
            populatedEmbed = true
          }
          const nextFieldInline = validFields[i + 1] && validFields[i + 1].inline
          const nextNextFieldInline = validFields[i + 2] && validFields[i + 2].inline
          if (!lookedAt.has(i)) {
            if (field.inline && nextFieldInline) {
              lookedAt.add(i).add(i + 1)
              if (nextNextFieldInline) {
                lookedAt.add(i + 2)
                gridColumnValues.push('1/5', '5/9', '9/13')
              } else {
                gridColumnValues.push('1/7', '7/13')
              }
            } else {
              lookedAt.add(i)
              gridColumnValues.push('1/13')
            }
          }
          fieldElements.push(
            <EmbedField key={`field${i}`} gridColumns={gridColumnValues[i]}>
              <EmbedFieldTitle>{parser.parseEmbedTitle(this.convertKeywords(field.title))}</EmbedFieldTitle>
              <EmbedFieldValue>{parser.parseAllowLinks(this.convertKeywords(field.value))}</EmbedFieldValue>
            </EmbedField>
          )
        }
      }
      if (populatedEmbed) {
        if (!hasEmbeds) hasEmbeds = true
        embedElements.push(
          <Embed key={`embed_preview${i}`}>
            <Pill color={properties[embedProperties.color]} />
            <NonPill>
              { properties[embedProperties.authorName] || properties[embedProperties.authorNameCamelCase]
                ? <Author>
                  { properties[embedProperties.authorIconUrl] || properties[embedProperties.authorIconUrlCamelCase] ? <img alt='Embed Author Icon' src={parsedProperties[embedProperties.authorIconUrl] || parsedProperties[embedProperties.authorIconUrlCamelCase]} /> : null }
                  { parsedProperties[embedProperties.authorUrl] || parsedProperties[embedProperties.authorUrlCamelCase] ? <a target='_blank' rel='noopener noreferrer' href={parsedProperties[embedProperties.authorUrl] || parsedProperties[embedProperties.authorUrlCamelCase]}>{parsedProperties[embedProperties.authorName] || parsedProperties[embedProperties.authorNameCamelCase]}</a> : parsedProperties[embedProperties.authorName] || parsedProperties[embedProperties.authorNameCamelCase] }
                </Author>
                : undefined }

              {parsedProperties[embedProperties.title]
                ? <Title as={properties[embedProperties.url] ? 'a' : 'span'} href={parsedProperties[embedProperties.url]} target='_blank' >
                  {parser.parseEmbedTitle(parsedProperties[embedProperties.title])}
                </Title>
                : null
              }
              {parsedProperties[embedProperties.description]
                ? <Description>{parser.parseAllowLinks(parsedProperties[embedProperties.description])}</Description>
                : null
              }
              { fieldElements.length > 0
                ? <EmbedFields>{fieldElements}</EmbedFields>
                : [] }
              { properties[embedProperties.thumbnailUrl] || properties[embedProperties.thumbnailUrlCamelCase]
                ? <Thumbnail href={parsedProperties[embedProperties.thumbnailUrl] || parsedProperties[embedProperties.thumbnailUrlCamelCase]} target='_blank'>
                  <img src={parsedProperties[embedProperties.thumbnailUrl] || parsedProperties[embedProperties.thumbnailUrlCamelCase]} alt='Embed Thumbnail' />
                </Thumbnail>
                : undefined }
              {/* </BodyWrapper> */}
              { properties[embedProperties.imageUrl] || properties[embedProperties.imageUrlCamelCase]
                ? <Image href={parsedProperties[embedProperties.imageUrl] || parsedProperties[embedProperties.imageUrlCamelCase]} target='_blank' >
                  <img src={parsedProperties[embedProperties.imageUrl] || parsedProperties[embedProperties.imageUrlCamelCase]} alt='Embed MainImage' />
                </Image>
                : undefined }

              { properties[embedProperties.footerText] || properties[embedProperties.footerTextCamelCase] || (parsedProperties[embedProperties.timestamp] && parsedProperties[embedProperties.timestamp] !== 'none')
                ? <Footer>
                  { parsedProperties[embedProperties.footerIconUrl] || parsedProperties[embedProperties.footerIconUrlCamelCase] ? <img src={parsedProperties[embedProperties.footerIconUrl] || parsedProperties[embedProperties.footerIconUrlCamelCase]} alt='Embed Footer Icon' /> : null }
                  {properties[embedProperties.footerText] || properties[embedProperties.footerTextCamelCase]}{(parsedProperties[embedProperties.timestamp] && parsedProperties[embedProperties.timestamp] !== 'none') ? `${parsedProperties[embedProperties.footerText] || parsedProperties[embedProperties.footerTextCamelCase] ? ' • ' : ''}[${parsedProperties[embedProperties.timestamp] === 'article' ? 'ARTICLE TIMESTAMP' : 'NOW TIMESTAMP'}]` : '' }
                </Footer>
                : undefined }
            </NonPill>
          </Embed>
        )
      }
    }

    return (
      <Wrapper>
        <UserInfo avatar={bot ? bot.displayAvatarURL : ''} >
          <div />
          <h2>
            <Username>{bot ? bot.username : 'Unknown'}</Username>
            <BotTag>BOT</BotTag>
            <TimeTag>Today at 12:00 AM</TimeTag>
          </h2>
        </UserInfo>
        <Content>
          { (message || defaultConfig.defaultMessage) === '{empty}' && hasEmbeds ? '' : article ? parser.parse(this.convertKeywords(message || defaultConfig.defaultMessage || ''), true, {}, parser.jumboify) : parser.parse(message || defaultConfig.defaultMessage || '', true, {}, parser.jumboify) }
          {embedElements}
        </Content>
      </Wrapper>
    )
  }
}

Message.propTypes = {
  embeds: PropTypes.array,
  message: PropTypes.string,
  articleId: PropTypes.number,
  articleList: PropTypes.array,
  guildId: PropTypes.string,
  feedId: PropTypes.string,
  subscribers: PropTypes.object,
  bot: PropTypes.object,
  defaultConfig: PropTypes.object
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Message))
