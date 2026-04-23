# ROBoard -- User Manual

## 1. Introduction

ROBoard is a lightweight spare‑parts search tool designed to simplify
the handling of spare parts exported from AMOS.

AMOS is a powerful Planned Maintenance System, but locating spare parts
quickly or managing working lists can be cumbersome. ROBoard solves this
by providing a fast, simple interface for searching and managing spare
parts locally.

The system reads spare‑part data exported from AMOS and presents it in
an easy‑to‑use interface.

Typical use cases include:

- Finding spare parts quickly
- Tracking ROB quantities
- Overriding storage locations when parts are moved
- Saving spare parts to a wishlist - aka parts which are requested by the crew

------------------------------------------------------------------------

## 2. Starting ROBoard

ROBoard runs in a web browser.

Open your browser and navigate to the ROBoard address provided for your
installation.

Example:

<http://roboard.local>

or

<http://localhost:5173>

Once opened, the main search interface will be displayed.

------------------------------------------------------------------------

## 3. Searching for Spare Parts

The search field at the top of the page allows you to quickly locate
spare parts.

You can search by:

- Part name
- Part number 7 Makers reference
- Internal spare part number
- EAN code (bar code)

The search is **instant and dynamic**, meaning results update while you
type.

### Tips for effective searching

- Use short keywords
- Try manufacturer names
- When seraching for AMOS spare part number (xxx.xx.xx.xx.xx.xxx) the period (".") is not necessary to enter.

Example searches:

- pump
- 651.19.00.00.02
- valve seat
- filter

Matching parts will appear immediately in the results list.

------------------------------------------------------------------------

## 4. Understanding the Part Card

Each spare part is displayed as a **Part Card** containing important
information.

Typical fields include:

- Part name
- Part number
- Location
- ROB (Remaining On Board)
- Wishlist indicator

This card is the central element for interacting with spare parts.

------------------------------------------------------------------------

## 5. Updating ROB (Remaining On Board)

The ROB field shows how many items are currently available onboard.

### To update ROB

1. Click the **ROB value**
2. Enter the new quantity
3. Confirm the update

The system immediately stores the new value.

Updating ROB is useful when:

- Parts are consumed
- Parts are received
- Stock corrections are required

------------------------------------------------------------------------

## 6. Using the Wishlist

The Wishlist allows users to mark parts that may be needed in the
future.

This is useful when:

- Planning maintenance
- Preparing spare‑parts orders
- Identifying commonly used parts

### Adding a part to the wishlist

1. Click the **star icon** on the Part Card
2. The part is added to your wishlist

### Removing from wishlist

Click the **star icon again**.

The part will be removed.

Wishlist items can be filtered or viewed separately depending on
configuration.

------------------------------------------------------------------------

## 7. Location Override

The location field normally comes from the AMOS export.

However, parts are sometimes moved onboard and the AMOS location may
become outdated.

ROBoard allows you to **override the location locally**.

### To override a location

1. Click the **pencil icon**
2. Enter the new location
3. Save the change

When a location has been overridden, the location text is displayed in
**dark yellow** to indicate that it differs from the AMOS data.

This helps users identify locally updated storage information.

------------------------------------------------------------------------

## 8. Importing Spare‑Part Data

ROBoard reads spare‑part data exported from AMOS.

The data is typically imported from an **Excel file**.

The import process updates the internal database with the latest
spare‑part list.

Typical workflow:

1. Export spare parts from AMOS
2. Save the Excel file
3. Import the file into ROBoard

The exact import procedure depends on the system installation.

After import, the new parts become searchable immediately.

------------------------------------------------------------------------

## 9. Typical Workflow

A common workflow when preparing maintenance work might look like this:

1. Search for required spare parts
2. Add relevant parts to the **wishlist**
3. Verify **ROB quantities**
4. Update ROB if parts are consumed
5. Override locations if parts have been moved

This makes it easy to track and prepare spare parts before starting a
job.

------------------------------------------------------------------------

## 10. Advantages of ROBoard

Compared with searching directly in AMOS, ROBoard offers:

- Much faster searching
- Cleaner interface
- Easier ROB updates
- Quick personal lists (wishlist)
- Ability to override storage locations

The goal is to make spare‑parts handling **faster and less frustrating
during daily operations onboard**.

------------------------------------------------------------------------

## 11. Known Limitations

ROBoard depends on the quality of the AMOS export.

If spare‑part information is missing or incorrect in AMOS, the same
issue will appear in ROBoard.

Location overrides and ROB updates are stored locally and are not
automatically synchronized back to AMOS.

------------------------------------------------------------------------

## 12. Future Features

Planned improvements may include:

- Barcode scanning
- Improved filtering
- Purchase order preparation
- Spare‑part usage tracking

------------------------------------------------------------------------

## 13. Support

For issues or improvement suggestions, contact the system maintainer.
