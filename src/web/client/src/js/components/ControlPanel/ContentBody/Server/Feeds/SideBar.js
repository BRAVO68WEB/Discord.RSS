import React, { Component, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import PageHeader from 'js/components/utils/PageHeader'
import SectionTitle from 'js/components/utils/SectionTitle'
import SectionSubtitle from 'js/components/utils/SectionSubtitle'
import PopInButton from '../../../utils/PopInButton'
import styled from 'styled-components'
import { Button, Dropdown, Input, Divider } from 'semantic-ui-react';
import axios from 'axios'
import { isMobile } from 'react-device-detect'
import posed from 'react-pose'
import pages from 'js/constants/pages'
import colors from 'js/constants/colors';
import moment from 'moment-timezone'
import { Scrollbars } from 'react-custom-scrollbars';
import {
  articlesFetching as articlesFetchingSelector,
  feedRemoving as feedRemovingSelector,
  feedEditing as feedEditingSelector
} from 'js/selectors/feeds'
import { setActiveFeed, fetchDeleteFeed, fetchEditFeed } from 'js/actions/feeds'

const Container = styled.div`
  width: 425px;
  height: 100%;
  background: #2f3136;
  /* overflow-y: ${props => props.populated ? 'auto' : 'hidden'}; */

`
const EditField = styled.div`
  margin-top: 1em;
`

const Content = styled.div`
  padding: 20px 10px;
  @media only screen and (min-width: 930px) {
    padding: 55px 27px;
  }
`

const ApplyField = styled.div`
  margin-top: 1.5em;
  display: flex;
  justify-content: flex-end;
  .ui.button {
    margin-left: 1em;
  }
`

const PosedDiv = posed.div({
  show: { opacity: 1, transition: { duration: 200 } },
  hide: { opacity: 0, transition: { duration: 200 } }
})

function SideBar (props) {
  const [inputTitle, setInputTitle] = useState('')
  const [inputChannel, setInputChannel] = useState('')
  const [refreshRate, setRefreshRate] = useState()
  const articlesFetching = useSelector(articlesFetchingSelector)
  const feedRemoving = useSelector(feedRemovingSelector)
  const feedEditing = useSelector(feedEditingSelector)
  const failRecords = useSelector(state => state.failRecords)
  const guildID = useSelector(state => state.activeGuildID)
  const activeGuild = useSelector(state => state.guilds.find(g => g.id === state.activeGuildID))
  const dispatch = useDispatch()
  // TODO: Do health, refresh rates
  const defaultConfig = useSelector(state => state.botConfig)
  const { selectedFeed, channelDropdownOptions } = props
  const selectedFailRecord = selectedFeed ? failRecords.find(r => r.url === selectedFeed.url) : null
  const hasFailed = !selectedFailRecord ? false : selectedFailRecord.alerted

  useEffect(() => {
    if (!selectedFeed || hasFailed) {
      return
    }
    console.log('fetching')
    axios.get(`/api/guilds/${guildID}/feeds/${selectedFeed._id}/schedule`)
      .then(({ data }) => {
        setRefreshRate(data.refreshRateMinutes)
      })
      .catch(console.error)
  }, [selectedFeed, hasFailed])

  if (!activeGuild || !selectedFeed) {
    return <div />
  }

  let differentFromDefault = false
  if (selectedFeed) {
    if (inputTitle && inputTitle !== selectedFeed.title) {
      differentFromDefault = true
    }
    if (inputChannel && inputChannel !== selectedFeed.channel) {
      differentFromDefault = true
    }
  }

  const dateTimezone = activeGuild.timezone || defaultConfig.timezone
  const dateFormat = activeGuild.dateFormat || defaultConfig.dateFormat
  const dateLanguage = activeGuild.dateLanguage || defaultConfig.dateLanguage
  const disabled = selectedFeed && selectedFeed.disabled

  async function redirect (page) {
    await dispatch(setActiveFeed(selectedFeed._id))
    props.redirect(page)
  }

  async function remove () {
    await dispatch(fetchDeleteFeed(guildID, selectedFeed._id))
    // props.onDeletedFeed()
  }

  function edit () {
    const payload = {}
    if (inputTitle && inputTitle !== selectedFeed.title) {
      payload.title = inputTitle
    }
    if (inputChannel && inputChannel !== selectedFeed.channel) {
      payload.channel = inputChannel
    }
    if (Object.keys(payload).length === 0) {
      return
    }
    dispatch(fetchEditFeed(guildID, selectedFeed._id, payload))
  }

  return (
    <Container populated={selectedFeed}>
      <Scrollbars>
      <Content>
      <PageHeader heading='Feed Details' subheading={'Select a feed'} />
      {/* <SectionItemTitle>Feed Details</SectionItemTitle> */}
      <Divider />
      <PosedDiv pose={selectedFeed ? 'show' : 'hide'}>
        <SectionTitle heading='Info' />
        <SectionSubtitle>Status</SectionSubtitle>
          { !selectedFeed
            ? '\u200b'
            : disabled
              ? <span style={{ color: colors.discord.yellow }}>Disabled ({selectedFeed.disabled})</span>
              : selectedFailRecord
                ? <span style={{ color: colors.discord.red }}>Failed ({moment(selectedFailRecord.failedAt).format('DD MMMM Y')})</span>
                : <div><span style={{ color: colors.discord.green }}>Normal</span></div>
        }
        <EditField>
          <SectionSubtitle>Refresh Rate</SectionSubtitle>
      { selectedFailRecord || disabled ? 'None ' : !selectedFeed ? '\u200b' : !refreshRate ? 'Determining... ' : refreshRate < 1 ? `${refreshRate * 60} seconds      ` : `${refreshRate} minutes      `}{ selectedFailRecord ? null : <a href='https://www.patreon.com/discordrss' target='_blank' rel='noopener noreferrer'>－</a> }
        </EditField>
        <EditField>
          <SectionSubtitle>Added On</SectionSubtitle>
          { !selectedFeed ? '\u200b' : !selectedFeed.addedOn ? 'Unknown' : moment(selectedFeed.addedOn).locale(dateLanguage).tz(dateTimezone).format(dateFormat)}
        </EditField>
        <Divider />
        <SectionTitle heading='Edit' />
        <EditField>
          <SectionSubtitle>Title</SectionSubtitle>
          <Input value={inputTitle || (selectedFeed ? selectedFeed.title : '')} fluid disabled={!selectedFeed} onChange={e => {
            setInputTitle(e.target.value)
          }} />
        </EditField>
        <EditField>
          <SectionSubtitle>Channel</SectionSubtitle>
          <Dropdown value={inputChannel || (selectedFeed ? selectedFeed.channel : '')} options={channelDropdownOptions} disabled={!selectedFeed || channelDropdownOptions.length === 0} search={!isMobile} selection fluid onChange={(e, data) => {
            setInputChannel(data.value)
          }} />
        </EditField>
        <ApplyField>
          <PopInButton basic inverted content='Reset' disabled={feedEditing || !differentFromDefault} pose={differentFromDefault ? 'enter' : 'exit'} onClick={e => {
            setInputTitle('')
            setInputChannel('')
          }} />
          <Button content='Save' color='green' disabled={!differentFromDefault} onClick={edit} />
        </ApplyField>
        <Divider />
        <SectionTitle heading='Customize' subheading='So many options!' />
        <EditField>
          <Button fluid content='Message/Embed' icon='angle right' labelPosition='right' onClick={e => redirect(pages.MESSAGE)} loading={articlesFetching} disabled={articlesFetching} />
        </EditField>
        <EditField>
          <Button fluid content='Filters' icon='angle right' labelPosition='right' onClick={e => redirect(pages.FILTERS)} loading={articlesFetching} disabled={articlesFetching} />
        </EditField>
        <EditField>
          <Button fluid content='Subscriptions' icon='angle right' labelPosition='right' onClick={e => redirect(pages.SUBSCRIPTIONS)} loading={articlesFetching} disabled={articlesFetching} />
        </EditField>
        <EditField>
          <Button fluid content='Misc Options' icon='angle right' labelPosition='right' onClick={e => redirect(pages.MISC_OPTIONS)} loading={articlesFetching} disabled={articlesFetching} />
        </EditField>
        <Divider />
        <SectionTitle heading='Remove' />
        <EditField>
          <Button fluid content='Remove' basic color='red' loading={feedRemoving} disabled={feedRemoving} onClick={remove}/>
        </EditField>
      </PosedDiv>
      </Content>
      </Scrollbars>
    </Container>
  )
}

export default SideBar

