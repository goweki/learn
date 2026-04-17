# Q-Sync Design Document

## Persona-Specific Workflows

**Date:** February 11, 2026

---

## Table of Contents

1. [Truck Owner Flows](#truck-owner-flows)
2. [Factory Manager Flows](#factory-manager-flows)
3. [Factory Guard Flows](#factory-guard-flows)
4. [System Admin Flows](#system-admin-flows)

---

## Truck Owner Flows

### Flow 1: Complete Onboarding Journey

```mermaid
flowchart TD
    Start([Receive Invitation Email/WhatsApp]) --> CheckToken{Token Valid?}
    CheckToken -->|Expired| TokenExpired[Show: Token Expired<br/>Contact Support]
    CheckToken -->|Valid| SetPassword[Onboarding Page<br/>Set Password Form]

    SetPassword --> ValidatePass{Password Valid?}
    ValidatePass -->|No| PassError[Show Validation Errors<br/>- Min 8 chars<br/>- 1 uppercase<br/>- 1 number]
    PassError --> SetPassword

    ValidatePass -->|Yes| CreateHash[Hash Password<br/>Update User.passwordHash<br/>status: ACTIVE]
    CreateHash --> CreateSession[Create Session Record<br/>sessionToken, ipAddress<br/>userAgent]
    CreateSession --> Dashboard[Redirect to Dashboard]

    Dashboard --> CheckFleet{Has Trucks<br/>or Drivers?}
    CheckFleet -->|No| ShowPrompt[Empty State:<br/>&quot;Add your fleet to start booking&quot;]
    CheckFleet -->|Yes| ShowContracts[Display Active Contracts<br/>Loading Advices<br/>Pending Bookings]

    ShowPrompt --> EndOnboard([Onboarding Complete])
    ShowContracts --> EndOnboard

    TokenExpired --> EndOnboard
```

---

### Flow 2: Fleet Registration (Truck)

```mermaid
flowchart TD
    Start([Click 'Add Truck']) --> TruckForm[Truck Registration Form]

    TruckForm --> Input1[Enter registrationNumber unique]
    Input1 --> Input2[Select type<br/>Flatbed/Container/Tanker]
    Input2 --> Input3[Enter capacity<br/>Select capacityUnit:<br/>TONS/CUBIC_METERS/PALLETS]
    Input3 --> Input4[Optional: make, model, year<br/>color, VIN]

    Input4 --> Upload1[Upload Images Required<br/>- imageFront<br/>- imageSideRight<br/>- imageSideLeft<br/>- imageRear]
    Upload1 --> Upload2[Upload Documents<br/>- registrationDoc<br/>- insuranceDoc + insuranceExpiry<br/>- inspectionDoc + dates]

    Upload2 --> Submit[Submit Form]
    Submit --> Validate{Validation}

    Validate -->|registrationNumber<br/>already exists| DupeError[Error: Registration number exists]
    DupeError --> Input1

    Validate -->|Missing required fields| FieldError[Show missing field errors]
    FieldError --> TruckForm

    Validate -->|Success| Create[Create Truck Record<br/>status: AVAILABLE<br/>currentAvailability: true]
    Create --> Notify[Show Success Message<br/>&quot;Truck added successfully&quot;]
    Notify --> NextAction{Add Another?}

    NextAction -->|Yes| TruckForm
    NextAction -->|No| Dashboard([Return to Dashboard])
```

---

### Flow 3: Create Booking (Multi-Truck)

```mermaid
flowchart TD
    Start([Navigate to Bookings]) --> ClickNew[Click 'Create Booking']
    ClickNew --> SelectAdvice[Select Loading Advice]

    SelectAdvice --> CheckTonnage{remainingTonnage > 0?}
    CheckTonnage -->|No| NoTonnage[Error: No tonnage available]
    NoTonnage --> End([Exit])

    CheckTonnage -->|Yes| ShowAvailable[Display:<br/>- productType<br/>- remainingTonnage<br/>- validFrom/validUntil]

    ShowAvailable --> SingleOrMulti{Booking Type?}
    SingleOrMulti -->|Single Truck| AddTruck1[Select 1 Truck + Driver]
    SingleOrMulti -->|Multi-Truck| AddTruck2[Click 'Add Truck' up to 10]

    AddTruck1 --> SetTonnage
    AddTruck2 --> SetTonnage[For Each Truck:<br/>- Select from available trucks<br/>- Assign driver<br/>- Set allocatedTonnage]

    SetTonnage --> ValidateTruck{Validations}
    ValidateTruck -->|allocatedTonnage ><br/>truck.capacity| CapError[Error: Exceeds truck capacity]
    CapError --> SetTonnage

    ValidateTruck -->|Sum > remainingTonnage| TonnageError[Error: Exceeds available tonnage]
    TonnageError --> SetTonnage

    ValidateTruck -->|Truck in use| AvailError[Error: Truck not available<br/>Check currentStatus]
    AvailError --> SetTonnage

    ValidateTruck -->|insuranceExpiry passed| DocError[Error: Insurance expired]
    DocError --> SetTonnage

    ValidateTruck -->|Success| SelectDate[Select scheduledDate<br/>Min: tomorrow<br/>Max: loadingAdvice.validUntil]

    SelectDate --> SelectTime[Select Time Slot<br/>From TimeSlot records<br/>where daysOfWeek matches]
    SelectTime --> Review[Review Summary:<br/>- Total trucks<br/>- Total tonnage<br/>- Date/Time<br/>- Product type]

    Review --> Confirm{Confirm?}
    Confirm -->|No| EditBooking[Back to Edit]
    EditBooking --> SingleOrMulti

    Confirm -->|Yes| CreateBooking[Create Booking:<br/>- referenceNumber auto-gen<br/>- status: PENDING<br/>- totalTonnage sum]

    CreateBooking --> CreateBT[Create BookingTruck array records:<br/>- qrCode unique per truck<br/>- sequenceNumber 1,2,3...<br/>- currentStatus: PENDING]

    CreateBT --> UpdateAdvice[Update LoadingAdvice:<br/>bookedTonnage += totalTonnage<br/>remainingTonnage -= totalTonnage]

    UpdateAdvice --> SendNotif[Create Notification:<br/>type: BOOKING_CREATED<br/>to: Manager<br/>channels: EMAIL]

    SendNotif --> Success[Show Success:<br/>&apos;Booking created successfully&apos;<br/>Display referenceNumber<br/>Status: Pending Approval]

    Success --> NextStep{What Next?}
    NextStep -->|View Details| ViewBooking[Navigate to Booking Details]
    NextStep -->|Create Another| ClickNew
    NextStep -->|Done| Dashboard([Return to Dashboard])
```

---

### Flow 4: Monitor Booking Status

```mermaid
flowchart TD
    Start([Open Booking Details]) --> LoadData[Fetch Booking with includes:<br/>- bookingTrucks.truck<br/>- bookingTrucks.driver<br/>- bookingTrucks.statusHistory<br/>- loadingBay]

    LoadData --> ShowOverview[Display Booking Info:<br/>- referenceNumber<br/>- status badge<br/>- scheduledDate/time<br/>- loadingBay.bayNumber]

    ShowOverview --> ShowTrucks[For Each BookingTruck:<br/>Display Card with:<br/>- truck.registrationNumber<br/>- driver.name<br/>- allocatedTonnage<br/>- currentStatus<br/>- Timeline]

    ShowTrucks --> CheckStatus{Booking.status?}

    CheckStatus -->|PENDING| ShowPending[Yellow Badge: Pending Approval<br/>Message: Awaiting manager review<br/>Action: Cancel option]

    CheckStatus -->|APPROVED| ShowApproved[Green Badge: Approved<br/>Action: Download QR Codes<br/>Show: QR code preview<br/>Show: Bay assignment]

    CheckStatus -->|REJECTED| ShowRejected[Red Badge: Rejected<br/>Show: rejectionReason<br/>Show: rejectedBy, rejectedAt<br/>Action: Create New Booking]

    CheckStatus -->|QUEUED| ShowQueued[Blue Badge: In Queue<br/>Show: Queue.position<br/>Show: estimatedWaitTime<br/>Real-time updates]

    CheckStatus -->|LOADING| ShowLoading[Purple Badge: Loading<br/>Show: loadingStartedAt<br/>Show: Bay number<br/>Estimated completion]

    CheckStatus -->|LOADED| ShowLoaded[Teal Badge: Loaded<br/>Show: loadingCompletedAt<br/>Show: weighbridgeIn/Out<br/>Show: actualTonnage]

    CheckStatus -->|DEPARTED| ShowDeparted[Gray Badge: Departed<br/>Show: departedAt<br/>Net weight calculated<br/>Action: Confirm Delivery]

    CheckStatus -->|DELIVERED| ShowDelivered[Dark Green Badge: Delivered<br/>Show: deliveredAt<br/>Complete timeline<br/>Action: Download Report]

    ShowPending --> AutoRefresh[WebSocket: Listen for status changes]
    ShowApproved --> AutoRefresh
    ShowQueued --> AutoRefresh
    ShowLoading --> AutoRefresh
    ShowLoaded --> AutoRefresh
    ShowDeparted --> AutoRefresh
    ShowDelivered --> CheckMulti
    ShowRejected --> End([End])

    AutoRefresh --> CheckMulti{Multi-Truck<br/>Booking?}
    CheckMulti -->|Yes| ShowIndividual[Each BookingTruck shows<br/>independent currentStatus<br/>Separate timelines]
    CheckMulti -->|No| ShowSingle[Single truck timeline]

    ShowIndividual --> Actions
    ShowSingle --> Actions[Available Actions:<br/>- Download QR codes<br/>- Contact manager<br/>- View history<br/>- Refresh status]

    Actions --> End
```

---

## Factory Manager Flows

### Flow 5: Issue Loading Advice

```mermaid
flowchart TD
    Start([Navigate to Loading Advices]) --> ClickIssue[Click 'Issue Loading Advice']

    ClickIssue --> SelectContract[Select Contract<br/>Filter by status: ACTIVE]
    SelectContract --> CheckRemaining{Contract<br/>remainingTonnage > 0?}

    CheckRemaining -->|No| NoTonnage[Error: Contract fully allocated]
    NoTonnage --> End([Exit])

    CheckRemaining -->|Yes| ShowContract[Display Contract Details:<br/>- totalTonnage<br/>- remainingTonnage<br/>- productType<br/>- validUntil]

    ShowContract --> InputTonnage[Enter tonnage to allocate]
    InputTonnage --> ValidateTonnage{tonnage ≤<br/>remainingTonnage?}

    ValidateTonnage -->|No| TonnageError[Error: Exceeds available tonnage<br/>Available: X tons]
    TonnageError --> InputTonnage

    ValidateTonnage -->|Yes| InputDates[Set Validity Period:<br/>- validFrom default: today<br/>- validUntil max: contract.endDate]

    InputDates --> ValidateDates{Dates Valid?}
    ValidateDates -->|validUntil ><br/>contract.endDate| DateError[Error: Beyond contract validity]
    DateError --> InputDates

    ValidateDates -->|Success| InputDetails[Enter Details:<br/>- deliveryAddress<br/>- loadingInstructions<br/>- specialRequirements<br/>- preferredLoadingDate]

    InputDetails --> UploadDocs[Optional: Upload<br/>adviceDocument]

    UploadDocs --> Review[Review Summary:<br/>- Contract<br/>- Tonnage allocation<br/>- Validity period<br/>- Instructions]

    Review --> Confirm{Confirm Issue?}
    Confirm -->|No| InputDetails

    Confirm -->|Yes| CreateAdvice[Create LoadingAdvice:<br/>- id auto-gen<br/>- status: PENDING<br/>- tonnage<br/>- bookedTonnage: 0<br/>- remainingTonnage: tonnage<br/>- productType from contract]

    CreateAdvice --> UpdateContract[Update Contract:<br/>remainingTonnage -= tonnage]

    UpdateContract --> CreateNotif[Create Notification:<br/>type: LOADING_ADVICE_ISSUED<br/>to: TruckOwner<br/>channels: EMAIL, WHATSAPP]

    CreateNotif --> AuditLog[Create AuditLog:<br/>action: LOADING_ADVICE_ISSUED<br/>entityType: LoadingAdvice<br/>oldValue/newValue]

    AuditLog --> Success[Success Message:<br/>Display advice ID<br/>Show notification sent]

    Success --> NextAction{What Next?}
    NextAction -->|View Advice| ViewDetails[Navigate to Advice Details]
    NextAction -->|Issue Another| ClickIssue
    NextAction -->|Done| Dashboard([Return to Dashboard])
```

---

### Flow 6: Approve/Reject Booking

```mermaid
flowchart TD
    Start([View Pending Approvals]) --> LoadBooking[Load Booking where:<br/>status: PENDING<br/>approvedById: null]

    LoadBooking --> ShowDetails[Display Full Details:<br/>- Booking info<br/>- LoadingAdvice<br/>- Contract<br/>- All BookingTrucks]

    ShowDetails --> CheckDocs[For Each BookingTruck:<br/>Validate Documents]

    CheckDocs --> Doc1{truck.registrationDoc<br/>exists?}
    Doc1 -->|No| MarkInvalid1[❌ Registration missing]
    Doc1 -->|Yes| Doc2{truck.insuranceDoc<br/>exists?}

    Doc2 -->|No| MarkInvalid2[❌ Insurance missing]
    Doc2 -->|Yes| Doc3{insuranceExpiry ><br/>today?}

    Doc3 -->|No| MarkExpired[⚠️ Insurance expired]
    Doc3 -->|Yes| Doc4{driver.licenseDoc<br/>exists?}

    Doc4 -->|No| MarkInvalid3[❌ License missing]
    Doc4 -->|Yes| Doc5{driver.licenseExpiry ><br/>today?}

    Doc5 -->|No| MarkExpired2[⚠️ License expired]
    Doc5 -->|Yes| MarkValid[✅ All documents valid]

    MarkInvalid1 --> ShowChecklist
    MarkInvalid2 --> ShowChecklist
    MarkInvalid3 --> ShowChecklist
    MarkExpired --> ShowChecklist
    MarkExpired2 --> ShowChecklist
    MarkValid --> ShowChecklist

    ShowChecklist[Display Validation Checklist:<br/>Document status per truck]

    ShowChecklist --> CheckTonnage{totalTonnage ≤<br/>loadingAdvice<br/>.remainingTonnage?}

    CheckTonnage -->|No| ShowTonnageError[⚠️ Exceeds available tonnage]
    CheckTonnage -->|Yes| CheckProduct{productType matches<br/>available bays?}

    ShowTonnageError --> Decision
    CheckProduct -->|No| ShowProductError[⚠️ No compatible bay available]
    CheckProduct -->|Yes| ShowAllGood[✅ Ready for approval]

    ShowProductError --> Decision
    ShowAllGood --> Decision{Manager Decision}

    Decision -->|Reject| RejectFlow[Enter Rejection]
    Decision -->|Approve| ApproveFlow[Assign Bay]

    RejectFlow --> SelectReason[Select rejectionReason:<br/>- Insufficient documentation<br/>- Invalid documents<br/>- Tonnage exceeds limit<br/>- Bay unavailable<br/>- Other]

    SelectReason --> EnterComment[Enter detailed explanation]

    EnterComment --> ConfirmReject{Confirm Rejection?}
    ConfirmReject -->|No| Decision

    ConfirmReject -->|Yes| UpdateReject[Update Booking:<br/>- status: REJECTED<br/>- rejectedBy: manager.id<br/>- rejectedAt: now<br/>- rejectionReason]

    UpdateReject --> NotifyReject[Create Notification:<br/>type: BOOKING_REJECTED<br/>to: TruckOwner<br/>channels: EMAIL, WHATSAPP]

    NotifyReject --> AuditReject[Create AuditLog:<br/>action: BOOKING_REJECTED]

    AuditReject --> ShowRejectSuccess[Success: Booking rejected<br/>Owner notified]
    ShowRejectSuccess --> End([Done])

    ApproveFlow --> SelectBay[Select Loading Bay<br/>Filter by:<br/>- status: AVAILABLE<br/>- productType in allowedProducts]

    SelectBay --> SetPriority{Set Priority?}
    SetPriority -->|Yes| MarkPriority[Set BookingTruck.isPriority: true]
    SetPriority -->|No| SkipPriority[Keep isPriority: false]

    MarkPriority --> EnterNotes
    SkipPriority --> EnterNotes[Optional: Enter managerNotes]

    EnterNotes --> ConfirmApprove{Confirm Approval?}
    ConfirmApprove -->|No| Decision

    ConfirmApprove -->|Yes| UpdateBooking[Update Booking:<br/>- status: APPROVED<br/>- approvedById: manager.id<br/>- approvedAt: now<br/>- loadingBayId]

    UpdateBooking --> UpdateTrucks[Update All BookingTrucks:<br/>- currentStatus: APPROVED<br/>- qrCode already exists]

    UpdateTrucks --> UpdateBay[Update LoadingBay:<br/>- status: OCCUPIED]

    UpdateBay --> CreateBayHistory[Create LoadingBayHistory:<br/>- fromStatus: AVAILABLE<br/>- toStatus: OCCUPIED<br/>- changedById: manager.id]

    CreateBayHistory --> NotifyApprove[Create Notification:<br/>type: BOOKING_APPROVED<br/>to: TruckOwner<br/>channels: EMAIL, WHATSAPP<br/>Include QR codes]

    NotifyApprove --> AuditApprove[Create AuditLog:<br/>action: BOOKING_APPROVED]

    AuditApprove --> ShowSuccess[Success: Booking approved<br/>QR codes sent<br/>Bay assigned]

    ShowSuccess --> NextBooking{More Pending?}
    NextBooking -->|Yes| LoadBooking
    NextBooking -->|No| End
```

---

### Flow 7: Monitor Queue & Manage Bays

```mermaid
flowchart TD
    Start([Open Queue Management]) --> LoadQueue[Query Queue records:<br/>- status: QUEUED, LOADING<br/>- orderBy: position ASC<br/>Include: bookingTruck, truck, driver]

    LoadQueue --> LoadBays[Query LoadingBays:<br/>- status: all<br/>Include: current bookings]

    LoadBays --> Display[Split View:<br/>Left: Queue List<br/>Right: Bay Grid]

    Display --> ShowQueue[Queue List:<br/>For each Queue record show:<br/>- position<br/>- queueNumber<br/>- truck.registrationNumber<br/>- driver.name<br/>- productType<br/>- allocatedTonnage<br/>- enteredAt<br/>- estimatedWaitTime]

    ShowQueue --> ShowBays[Bay Grid:<br/>For each LoadingBay show:<br/>- bayNumber<br/>- status<br/>- current truck if OCCUPIED<br/>- allowedProducts<br/>- capacity utilization]

    ShowBays --> WebSocket[WebSocket: Real-time updates<br/>Auto-refresh every 10s]

    WebSocket --> ManagerAction{Manager Action}

    ManagerAction -->|Reorder Queue| DragDrop[Drag truck to new position]
    DragDrop --> UpdatePosition[Update Queue.position<br/>for affected records]
    UpdatePosition --> NotifyReorder[Create Notification:<br/>type: QUEUE_POSITION_UPDATED<br/>to: Affected truck owners]
    NotifyReorder --> AuditReorder[Create AuditLog:<br/>action: QUEUE_REORDERED]
    AuditReorder --> Display

    ManagerAction -->|Call Next Truck| SelectNext[Select truck at position 1<br/>with status: QUEUED]
    SelectNext --> ConfirmCall{Confirm call to bay?}
    ConfirmCall -->|No| Display
    ConfirmCall -->|Yes| UpdateToLoading[Guard will update via mobile:<br/>BookingTruck.currentStatus: LOADING<br/>Queue.status: LOADING<br/>loadingStartedAt: now]
    UpdateToLoading --> Display

    ManagerAction -->|Mark Bay Maintenance| SelectBay[Select LoadingBay]
    SelectBay --> ConfirmMaint{Confirm maintenance?}
    ConfirmMaint -->|No| Display
    ConfirmMaint -->|Yes| UpdateBayStatus[Update LoadingBay.status: MAINTENANCE]
    UpdateBayStatus --> CreateBayHist[Create LoadingBayHistory:<br/>fromStatus → MAINTENANCE]
    CreateBayHist --> Display

    ManagerAction -->|View Details| ViewTruck[Show BookingTruck details:<br/>- Full booking info<br/>- StatusHistory timeline<br/>- Document preview]
    ViewTruck --> Display

    ManagerAction -->|Refresh| LoadQueue

    ManagerAction -->|Exit| End([Exit Queue Management])
```

---

## Factory Guard Flows

### Flow 8: QR Code Check-In

```mermaid
flowchart TD
    Start([Open Mobile Scanner]) --> Camera[Activate Camera<br/>Show scanning frame overlay]

    Camera --> ScanQR[Guard points camera<br/>at truck's QR code]

    ScanQR --> ReadCode{QR Code Detected?}
    ReadCode -->|No| Camera

    ReadCode -->|Yes| Vibrate[Haptic feedback<br/>Beep sound]

    Vibrate --> QueryDB[Query BookingTruck<br/>where qrCode = scanned]

    QueryDB --> CheckExists{Record Found?}

    CheckExists -->|No| ShowInvalid[❌ Invalid QR Code<br/>Red screen<br/>Error sound]
    ShowInvalid --> Options1{Guard Action}
    Options1 -->|Retry| Camera
    Options1 -->|Manual Entry| ManualEntry[Enter booking reference<br/>or truck registration]
    Options1 -->|Contact Manager| CallManager[Show manager contact<br/>WhatsApp/Phone buttons]
    CallManager --> End([Exit])
    ManualEntry --> SearchDB[Search Booking/BookingTruck]
    SearchDB --> CheckExists

    CheckExists -->|Yes| LoadDetails[Load Full Record:<br/>Include: booking, truck<br/>driver, loadingAdvice<br/>loadingBay]

    LoadDetails --> CheckStatus{currentStatus?}

    CheckStatus -->|Not APPROVED| ShowError[❌ Cannot Check In<br/>Status: currentStatus<br/>Must be APPROVED]
    ShowError --> End

    CheckStatus -->|APPROVED| CheckSchedule{scheduledDate ≈<br/>today?}

    CheckSchedule -->|> 2 hours early| ShowEarly[⚠️ Early Arrival<br/>Scheduled: scheduledDate<br/>Current: now<br/>Options:<br/>1. Check in anyway<br/>2. Direct to parking]
    ShowEarly --> EarlyChoice{Guard Choice}
    EarlyChoice -->|Parking| SendParking[Show parking directions<br/>Log early arrival]
    SendParking --> End
    EarlyChoice -->|Check In| ShowDetails

    CheckSchedule -->|On time<br/>or late| ShowDetails[✅ Valid Check-In<br/>Green screen<br/>Display:<br/>- referenceNumber<br/>- truck.registrationNumber<br/>- driver.name<br/>- productType<br/>- allocatedTonnage<br/>- loadingBay.bayNumber]

    ShowDetails --> VerifyDriver[Guard verifies:<br/>Driver ID matches<br/>driver.name]

    VerifyDriver --> ConfirmCheckIn{Confirm Check-In?}
    ConfirmCheckIn -->|No| Camera

    ConfirmCheckIn -->|Yes| Transaction[Start Database Transaction]

    Transaction --> Update1[Update BookingTruck:<br/>- currentStatus: QUEUED<br/>- checkedInAt: now]

    Update1 --> CalcPosition[Calculate Queue Position:<br/>Get max position + 1<br/>or use isPriority for priority]

    CalcPosition --> CreateQueue[Create Queue record:<br/>- queueNumber unique<br/>- position<br/>- isPriority<br/>- enteredAt: now<br/>- status: QUEUED]

    CreateQueue --> CreateHistory[Create StatusHistory:<br/>- fromStatus: APPROVED<br/>- toStatus: QUEUED<br/>- updatedBy: guard.id<br/>- location: &apos;Factory Gate&apos;<br/>- timestamp: now]

    CreateHistory --> CreateNotif[Create Notification:<br/>type: TRUCK_CHECKED_IN<br/>to: TruckOwner<br/>channels: WHATSAPP<br/>message:&apos;Queue position: X&apos;]

    CreateNotif --> CommitTx[Commit Transaction]

    CommitTx --> ShowSuccess[✅ Check-In Successful<br/>Display:<br/>- Queue position<br/>- Estimated wait time<br/>- Bay assignment<br/>- Directions to waiting area]

    ShowSuccess --> PrintGate{Print Gate Pass?}
    PrintGate -->|Yes| PrintPass[Generate & Print:<br/>- Truck registration<br/>- Queue number<br/>- Time in<br/>- Bay assignment]
    PrintGate -->|No| SkipPrint

    PrintPass --> AutoReturn[Auto-return to scanner<br/>after 3 seconds]
    SkipPrint --> AutoReturn

    AutoReturn --> Camera
```

---

### Flow 9: Update Truck Status (Loading → Departed)

```mermaid
flowchart TD
    Start([Guard Opens Status Update]) --> ViewQueue[Display Current Queue:<br/>Filter by status:<br/>QUEUED, LOADING, LOADED]

    ViewQueue --> SelectTruck[Guard selects truck<br/>by tapping card]

    SelectTruck --> ShowCurrent[Display Current Status:<br/>- truck.registrationNumber<br/>- driver.name<br/>- currentStatus<br/>- Bay location<br/>- Time in status]

    ShowCurrent --> CheckCurrent{currentStatus?}

    CheckCurrent -->|QUEUED| ShowQueued[Available Actions:<br/>1. Start Loading<br/>2. Cancel/No Show]

    CheckCurrent -->|LOADING| ShowLoading[Available Actions:<br/>1. Mark Loaded<br/>2. Report Issue]

    CheckCurrent -->|LOADED| ShowLoaded[Available Actions:<br/>1. Capture Weighbridge<br/>2. Mark Departed]

    ShowQueued --> ActionQueued{Guard Action}
    ActionQueued -->|Start Loading| ConfirmLoad{Bay ready?}

    ConfirmLoad -->|No| ShowQueued
    ConfirmLoad -->|Yes| UpdateLoading[Update BookingTruck:<br/>- currentStatus: LOADING<br/>- loadingStartedAt: now]

    UpdateLoading --> UpdateQueue1[Update Queue:<br/>- status: LOADING]
    UpdateQueue1 --> CreateHist1[Create StatusHistory:<br/>QUEUED → LOADING]
    CreateHist1 --> NotifyLoading[Notification:<br/>type: LOADING_STARTED]
    NotifyLoading --> Success1[✅ Loading Started]
    Success1 --> ViewQueue

    ActionQueued -->|Cancel| EnterReason1[Enter cancellation reason]
    EnterReason1 --> UpdateCancel[Update currentStatus: CANCELLED]
    UpdateCancel --> ViewQueue

    ShowLoading --> ActionLoading{Guard Action}
    ActionLoading -->|Mark Loaded| EnterTonnage[Enter Actual Tonnage:<br/>actualTonnage field]

    EnterTonnage --> ValidateTonnage{≈ allocatedTonnage?}
    ValidateTonnage -->|Significant<br/>variance| ShowWarning[⚠️ Tonnage Variance<br/>Allocated: X<br/>Actual: Y<br/>Confirm?]
    ShowWarning --> ConfirmVar{Confirm?}
    ConfirmVar -->|No| EnterTonnage
    ConfirmVar -->|Yes| UpdateLoaded

    ValidateTonnage -->|Normal| UpdateLoaded[Update BookingTruck:<br/>- currentStatus: LOADED<br/>- loadingCompletedAt: now<br/>- actualTonnage]

    UpdateLoaded --> CreateHist2[Create StatusHistory:<br/>LOADING → LOADED]
    CreateHist2 --> NotifyLoaded[Notification:<br/>type: LOADING_COMPLETED]
    NotifyLoaded --> Success2[✅ Loading Complete<br/>Direct to Weighbridge]
    Success2 --> ViewQueue

    ActionLoading -->|Report Issue| EnterIssue[Enter issue details:<br/>- Equipment failure<br/>- Product issue<br/>- Driver issue<br/>- Other]
    EnterIssue --> NotifyManager[Alert Manager<br/>with issue details]
    NotifyManager --> ViewQueue

    ShowLoaded --> ActionLoaded{Guard Action}
    ActionLoaded -->|Weighbridge| EnterWeights[Enter Weighbridge Data:<br/>- weighbridgeIn weight<br/>- weighbridgeOut weight]

    EnterWeights --> CalcNet[Calculate Net Weight:<br/>weighbridgeOut - weighbridgeIn]
    CalcNet --> ShowNet[Display Net Weight<br/>vs. allocatedTonnage]

    ShowNet --> ConfirmWeights{Confirm Weights?}
    ConfirmWeights -->|No| EnterWeights

    ConfirmWeights -->|Yes| UpdateDeparted[Update BookingTruck:<br/>- currentStatus: DEPARTED<br/>- departedAt: now<br/>- weighbridgeIn<br/>- weighbridgeOut]

    UpdateDeparted --> UpdateQueue2[Update Queue:<br/>- exitedAt: now<br/>- actualWaitTime: calculated]

    UpdateQueue2 --> UpdateAdvice[Update LoadingAdvice:<br/>- bookedTonnage<br/>- remainingTonnage]

    UpdateAdvice --> UpdateBay[Update LoadingBay.status:<br/>OCCUPIED → AVAILABLE]

    UpdateBay --> CreateBayHist[Create LoadingBayHistory:<br/>OCCUPIED → AVAILABLE]

    CreateBayHist --> CreateHist3[Create StatusHistory:<br/>LOADED → DEPARTED]

    CreateHist3 --> NotifyDeparted[Notification:<br/>type: TRUCK_DEPARTED]

    NotifyDeparted --> CheckBooking{All BookingTrucks<br/>departed?}

    CheckBooking -->|Yes| UpdateBookingStatus[Update Booking.status:<br/>DEPARTED]
    UpdateBookingStatus --> WebhookERP[Send Webhook to ERP:<br/>booking.completed event]

    CheckBooking -->|No| SkipBooking[Other trucks still loading]

    WebhookERP --> Success3
    SkipBooking --> Success3[✅ Truck Departed<br/>Safe travels!]

    Success3 --> PrintGatePass{Print Exit Pass?}
    PrintGatePass -->|Yes| PrintExit[Print with:<br/>- Time out<br/>- Net weight<br/>- Signature]
    PrintGatePass -->|No| ViewQueue
    PrintExit --> ViewQueue
```

---

## System Admin Flows

### Flow 10: Create API Key for ERP Integration

```mermaid
flowchart TD
    Start([Admin Dashboard]) --> Navigate[Navigate to<br/>API Keys Management]

    Navigate --> ViewKeys[Display Existing Keys:<br/>- name<br/>- key masked<br/>- permissions<br/>- lastUsedAt<br/>- expiresAt<br/>- isActive]

    ViewKeys --> ClickNew[Click 'Generate New API Key']

    ClickNew --> Form[API Key Creation Form]

    Form --> InputName[Enter name:<br/>e.g.,&apos;Production ERP&apos;]
    InputName --> InputDesc[Enter description:<br/>Purpose and usage notes]

    InputDesc --> SelectPerms[Select Permissions:<br/>☑ contracts<br/>☑ users<br/>☑ loading_advices<br/>☐ bookings<br/>☐ reports]

    SelectPerms --> SetExpiry{Set Expiry?}
    SetExpiry -->|Yes| SelectDate[Select expiresAt date<br/>Recommended: 90 days]
    SetExpiry -->|No| NoExpiry[expiresAt: null<br/>⚠️ No expiration]

    SelectDate --> Review
    NoExpiry --> Review[Review Settings:<br/>- Name<br/>- Permissions<br/>- Expiry<br/>- Created by: admin]

    Review --> Confirm{Generate Key?}
    Confirm -->|No| Form

    Confirm -->|Yes| GenerateKey[Generate Secure Key:<br/>randomBytes 32<br/>Format: hex string]

    GenerateKey --> CreateRecord[Create ApiKey record:<br/>- key unique<br/>- name<br/>- permissions JSON<br/>- isActive: true<br/>- createdById: admin.id]

    CreateRecord --> AuditLog[Create AuditLog:<br/>action: API_KEY_CREATED<br/>entityType: ApiKey]

    AuditLog --> ShowKey[⚠️ IMPORTANT Display:<br/>&apos;Save this key securely<br/>It will only be shown once&apos;<br/><br/>Display full key:<br/>Copy button<br/>Download .env format]

    ShowKey --> UserAction{Admin Action}
    UserAction -->|Copy| CopyClip[Copy to clipboard<br/>Show: ✅ Copied]
    UserAction -->|Download| DownloadEnv[Download .env file:<br/>ERP_API_KEY=xxxxx]
    UserAction -->|Done| ConfirmSaved{Confirm Saved?}

    CopyClip --> UserAction
    DownloadEnv --> UserAction

    ConfirmSaved -->|No| ShowKey
    ConfirmSaved -->|Yes| MaskKey[Key now masked in UI:<br/>Display: &apos;xxxxxx...xxxxx&apos;]

    MaskKey --> ShowInstructions[Show Integration Guide:<br/>1. Add to ERP .env<br/>2. Test endpoints<br/>3. Monitor usage]

    ShowInstructions --> ViewKeys
```

---

### Flow 11: User Management - Create Truck Owner

```mermaid
flowchart TD
    Start([Admin: User Management]) --> ViewUsers[Display All Users:<br/>Filter by role, status<br/>Search by name/email]

    ViewUsers --> ClickCreate[Click 'Create User']

    ClickCreate --> SelectRole[Select UserRole:<br/>○ TRUCK_OWNER<br/>○ FACTORY_MANAGER<br/>○ FACTORY_GUARD<br/>○ SYSTEM_ADMIN]

    SelectRole --> CheckRole{Role Selected?}
    CheckRole -->|TRUCK_OWNER| OwnerForm[Truck Owner Form]
    CheckRole -->|Other| OtherForm[Standard User Form]

    OwnerForm --> Input1[Enter email unique]
    Input1 --> Input2[Enter name]
    Input2 --> Input3[Enter phone unique]
    Input3 --> Input4[Enter whatsapp]

    Input4 --> Input5[TruckOwner Details:<br/>- companyName required<br/>- contactPerson<br/>- businessPhone<br/>- businessEmail<br/>- taxIdentificationNo unique<br/>- businessRegistration unique]

    Input5 --> Input6[Address:<br/>- address<br/>- city<br/>- region<br/>- country default: Djibouti]

    Input6 --> SetStatus[Set Initial Status:<br/>○ ACTIVE<br/>○ PENDING_VERIFICATION<br/>● INACTIVE]

    SetStatus --> SendInvite{Send Invitation?}
    SendInvite -->|Yes| SelectChannels[Select Channels:<br/>☑ Email<br/>☑ WhatsApp<br/>☐ SMS]
    SendInvite -->|No| SkipInvite[passwordHash: null<br/>Manual setup required]

    SelectChannels --> GenToken[Generate verificationToken<br/>48h expiry]

    GenToken --> Review[Review All Data]
    SkipInvite --> Review

    Review --> Validate{Validation}

    Validate -->|email exists| ErrorEmail[Error: Email in use]
    ErrorEmail --> Input1

    Validate -->|phone exists| ErrorPhone[Error: Phone in use]
    ErrorPhone --> Input3

    Validate -->|taxId exists| ErrorTax[Error: Tax ID in use]
    ErrorTax --> Input5

    Validate -->|Success| Transaction[Start Transaction]

    Transaction --> CreateUser[Create User record:<br/>- email<br/>- name<br/>- phone, whatsapp<br/>- role: TRUCK_OWNER<br/>- status<br/>- passwordHash: null<br/>- verificationToken<br/>- emailVerified: null]

    CreateUser --> CreateOwner[Create TruckOwner record:<br/>- userId: user.id<br/>- companyName<br/>- verificationStatus: PENDING<br/>- businessPhone<br/>- businessEmail<br/>- taxIdentificationNo<br/>- businessRegistration<br/>- address, city, region, country]

    CreateOwner --> CommitTx[Commit Transaction]

    CommitTx --> CheckInvite{Invitation?}
    CheckInvite -->|Yes| SendEmail[Send invitation email]
    SendEmail --> SendWhatsApp[Send WhatsApp if enabled]
    SendWhatsApp --> NotifSent

    CheckInvite -->|No| NotifSent[Show Success:<br/>- User ID<br/>- Credentials<br/>- Next steps]

    NotifSent --> AuditLog[Create AuditLog:<br/>action: USER_CREATED<br/>entityType: User]

    AuditLog --> NextAction{Admin Action}
    NextAction -->|View User| ViewDetails[Show User Profile]
    NextAction -->|Create Another| ClickCreate
    NextAction -->|Done| ViewUsers
```

---

### Flow 12: System Configuration - Time Slots

```mermaid
flowchart TD
    Start([Admin: System Config]) --> NavSlots[Navigate to Time Slots]

    NavSlots --> ViewSlots[Display All TimeSlots:<br/>Group by day<br/>Show active/inactive]

    ViewSlots --> Action{Admin Action}

    Action -->|Add Slot| ClickAdd[Click 'Add Time Slot']
    Action -->|Edit Slot| SelectEdit[Select existing slot]
    Action -->|Delete Slot| SelectDelete[Select slot to delete]
    Action -->|Bulk Copy| BulkCopy[Copy slots to other days]

    ClickAdd --> SlotForm[Time Slot Form]

    SlotForm --> InputStart[Enter startTime:<br/>Format: &quot;HH:MM&quot;<br/>e.g., &quot;08:00&quot;]

    InputStart --> InputEnd[Enter endTime:<br/>Format: &quot;HH:MM&quot;<br/>Must be > startTime]

    InputEnd --> ValidateTime{Times Valid?}
    ValidateTime -->|Overlap exists| ErrorOverlap[Error: Overlaps existing slot]
    ErrorOverlap --> InputStart

    ValidateTime -->|endTime ≤ startTime| ErrorSequence[Error: End must be after start]
    ErrorSequence --> InputEnd

    ValidateTime -->|Success| InputCapacity[Enter maxCapacity:<br/>Tons available in slot]

    InputCapacity --> SelectDays[Select daysOfWeek:<br/>☑ Monday 1<br/>☑ Tuesday 2<br/>☑ Wednesday 3<br/>☑ Thursday 4<br/>☑ Friday 5<br/>☐ Saturday 6<br/>☐ Sunday 0]

    SelectDays --> SetActive[Set isActive:<br/>☑ Active<br/>☐ Inactive]

    SetActive --> ReviewSlot[Review Time Slot:<br/>- Time range<br/>- Capacity<br/>- Days<br/>- Status]

    ReviewSlot --> CheckUnique{Check Unique<br/>Constraint}

    CheckUnique -->|Duplicate<br/>start+end| ErrorDupe[Error: Time slot exists]
    ErrorDupe --> InputStart

    CheckUnique -->|Unique| CreateSlot[Create TimeSlot record:<br/>- startTime<br/>- endTime<br/>- maxCapacity<br/>- daysOfWeek int array<br/>- isActive]

    CreateSlot --> AuditSlot[Create AuditLog:<br/>action: TIME_SLOT_CREATED]

    AuditSlot --> SuccessSlot[✅ Time Slot Created<br/>Now available for bookings]

    SuccessSlot --> ViewSlots

    SelectEdit --> LoadSlot[Load TimeSlot data]
    LoadSlot --> EditForm[Populate form with<br/>existing values]
    EditForm --> ModifyFields[Admin modifies fields]
    ModifyFields --> UpdateSlot[Update TimeSlot record]
    UpdateSlot --> AuditEdit[Create AuditLog:<br/>action: TIME_SLOT_UPDATED<br/>oldValue/newValue]
    AuditEdit --> ViewSlots

    SelectDelete --> ConfirmDelete{Confirm Delete?<br/>Check for dependencies}
    ConfirmDelete -->|Bookings exist| ErrorDelete[Error: Cannot delete<br/>Active bookings use this slot]
    ErrorDelete --> ViewSlots

    ConfirmDelete -->|No dependencies| DeleteSlot[Delete TimeSlot]
    DeleteSlot --> AuditDelete[Create AuditLog:<br/>action: TIME_SLOT_DELETED]
    AuditDelete --> ViewSlots

    BulkCopy --> SelectSource[Select source day<br/>and time slots]
    SelectSource --> SelectTarget[Select target days:<br/>Multiple selection]
    SelectTarget --> ConfirmCopy{Confirm Copy?}
    ConfirmCopy -->|No| ViewSlots
    ConfirmCopy -->|Yes| DuplicateSlots[Create TimeSlot records<br/>for each target day]
    DuplicateSlots --> ViewSlots
```

---

## Cross-Persona Interaction Flows

### Flow 13: Complete Lifecycle (All Personas)

```mermaid
sequenceDiagram
    participant Admin as System Admin
    participant ERP as ERP System
    participant Manager as Factory Manager
    participant Owner as Truck Owner
    participant Guard as Factory Guard
    participant System as Q-Sync System

    Note over Admin,System: Setup Phase
    Admin->>System: Create API Key
    System->>Admin: Return key (one-time display)
    Admin->>ERP: Configure API key in ERP

    Note over Admin,System: Account & Contract
    ERP->>System: POST /api/integrations/users
    System->>System: Create User + TruckOwner
    System->>Owner: Send invitation (email/WhatsApp)
    Owner->>System: Click link, set password
    System->>Owner: Login success, show dashboard

    ERP->>System: POST /api/integrations/contracts
    System->>System: Create Contract (remainingTonnage = total)

    Manager->>System: Issue Loading Advice
    System->>System: Create LoadingAdvice<br/>Update Contract.remainingTonnage
    System->>Owner: Notification: New loading advice

    Note over Owner,Guard: Booking & Approval
    Owner->>System: Add trucks and drivers
    System->>System: Create Truck, Driver records

    Owner->>System: Create booking (multi-truck)
    System->>System: Create Booking + BookingTrucks<br/>Generate QR codes
    System->>Manager: Notification: Pending approval

    Manager->>System: Review booking
    System->>Manager: Display docs, validations
    Manager->>System: Approve + assign bay
    System->>System: Update status: APPROVED<br/>Update LoadingBay: OCCUPIED
    System->>Owner: Send QR codes (email/WhatsApp)

    Note over Owner,Guard: Operations Day
    Owner->>Guard: Truck arrives, shows QR code
    Guard->>System: Scan QR code
    System->>Guard: Display truck details
    Guard->>System: Confirm check-in
    System->>System: Update status: QUEUED<br/>Create Queue record
    System->>Owner: WhatsApp: Checked in, position X

    Manager->>System: Monitor queue (real-time)
    System->>Manager: WebSocket updates

    Guard->>System: Bay ready, start loading
    System->>System: Update status: LOADING
    System->>Owner: WhatsApp: Loading started

    Guard->>System: Loading complete
    System->>System: Update status: LOADED
    System->>Owner: WhatsApp: Loading complete

    Guard->>System: Enter weighbridge data
    Guard->>System: Mark departed
    System->>System: Update status: DEPARTED<br/>Update Queue.exitedAt<br/>Update LoadingBay: AVAILABLE<br/>Update LoadingAdvice tonnage
    System->>Owner: WhatsApp: Truck departed
    System->>ERP: Webhook: booking.completed

    Note over Admin,ERP: Post-Operations
    Admin->>System: View audit logs
    System->>Admin: Display all actions with timestamps
    Manager->>System: Generate reports
    System->>Manager: Analytics dashboard + export
```

---
