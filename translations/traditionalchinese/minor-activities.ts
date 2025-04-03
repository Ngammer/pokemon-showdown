import type { Translations } from "../../server/chat";

export const translations: Translations = {
	strings: {
		"The announcement has ended.": "廣播已結束",
		"Battles do not support announcements.": "對戰裡不支持廣播",
		"You are not allowed to use filtered words in announcements.": "廣播裡不能使用被禁的詞語",
		"There is already a poll or announcement in progress in this room.": "本房已有投票或廣播",
		"An announcement was started by ${user.name}.": "${user.name}開了一個廣播",
		"There is no announcement running in this room.": "本房沒有廣播",
		"There is no timer to clear.": "無定時器可以刪除",
		"The announcement timer was turned off.": "廣播定時器已被關閉",
		"Invalid time given.": "所定的時間無效",
		"The announcement timer is off.": "廣播定時器已關閉",
		"The announcement was ended by ${user.name}.": "廣播已被${user.name}終結",
		"Accepts the following commands:": "隻接受下列的指令",

		"That option is not selected.": "沒有選擇",
		"You have already voted for this poll.": "你有已經投票了",
		"No options selected.": "無選擇",
		"you will not be able to vote after viewing results": "點開結果后就不能再投票",
		"View results": "看結果",
		"You can't vote after viewing results": "你已看了結果，無法投票",
		"The poll has ended &ndash; scroll down to see the results": "投票結束&ndash;結論在此",
		"Vote for ${num}": "投給${num}",
		"Submit your vote": "提交選擇",
		"Quiz": "測驗",
		"Poll": "投票",
		"Submit": "提交",
		"ended": "終結了",
		"votes": "票數",
		"delete": "刪除",
		"Poll too long.": "投票太長",
		"Battles do not support polls.": "對戰裡不支持投票",
		"You are not allowed to use filtered words in polls.": "投票裡不能使用被禁的詞語",
		"Not enough arguments for /poll new.": "投票參數不夠使用/poll new",
		"Too many options for poll (maximum is 8).": "投票選項不能超越8個",
		"There are duplicate options in the poll.": "投票選項裡有重復",
		"${user.name} queued a poll.": "${user.name}安插了下一個投票",
		"A poll was started by ${user.name}.": "${user.name}開了一個投票",
		"The queue is already empty.": "隊列已是空的",
		"Cleared poll queue.": "投票隊列被清空",
		"Room \"${roomid}\" not found.": "找不到\"${roomid}\"房",
		"Can't delete poll at slot ${slotString} - \"${slotString}\" is not a number.": "${slotString} - \"${slotString}\"位置不是數字，無法從投票裡刪除",
		"There is no poll in queue at slot ${slot}.": "這個位置沒有投票隊列",
		"(${user.name} deleted the queued poll in slot ${slot}.)": "(${user.name}在${slot}位置刪除了隊列裡的投票",
		"There is no poll running in this room.": "隊列的這個位置沒有投票",
		"To vote, specify the number of the option.": "請指明選項",
		"Option not in poll.": "投票裡沒有這個選項",
		"The poll timer was turned off.": "投票定時器已被關閉",
		"The queued poll was started.": "下一個投票開始了",
		"The poll timer was turned on: the poll will end in ${timeout} minute(s).": "投票將在${timeout}分鐘后終結",
		"The poll timer was set to ${timeout} minute(s) by ${user.name}.": "${user.name}.設定了${timeout}分鐘的投票定時器",
		"The poll timer is on and will end in ${poll.timeoutMins} minute(s).": "投票將在${poll.timeoutMins}分鐘后終結",
		"The poll timer is off.": "投票定時器已關閉",
		"The poll was ended by ${user.name}.": "投票已被${user.name}終結",
		"Queued polls:": "投票隊列",
		"Refresh": "刷新",
		"No polls queued.": "隊列裡無投票",
		"#${number} in queue": "隊列裡第${number}個",
	},
};
