import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import { FiCalendar } from 'react-icons/fi';
import {
  buildGoogleCalendarUrl,
  buildIcsFileContent,
  buildOutlookWebUrl,
  downloadIcsFile,
  type CalendarEventInput,
} from '@/lib/eventCalendarLinks';

type Props = {
  calendarInput: CalendarEventInput;
  icsUid: string;
  filename: string;
};

export default function AddToCalendarMenu({ calendarInput, icsUid, filename }: Props) {
  const googleUrl = buildGoogleCalendarUrl(calendarInput);
  const outlookUrl = buildOutlookWebUrl(calendarInput);
  const icsContent = buildIcsFileContent(calendarInput, icsUid);

  return (
    <Menu>
      <MenuButton
        as={Button}
        leftIcon={<FiCalendar />}
        variant="satrfOutline"
        minH="44px"
        aria-label="Add to calendar"
        data-testid="add-to-calendar"
      >
        Add to Calendar
      </MenuButton>
      <MenuList>
        {googleUrl && (
          <MenuItem as="a" href={googleUrl} target="_blank" rel="noopener noreferrer">
            Google Calendar
          </MenuItem>
        )}
        {outlookUrl && (
          <MenuItem as="a" href={outlookUrl} target="_blank" rel="noopener noreferrer">
            Outlook web
          </MenuItem>
        )}
        {icsContent && (
          <MenuItem
            onClick={() => downloadIcsFile(filename, icsContent)}
            data-testid="download-ics"
          >
            Apple / Outlook (.ics)
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
}
